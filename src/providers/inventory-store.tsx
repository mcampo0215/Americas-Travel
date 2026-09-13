import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import { db } from '@/lib/firebase';
import { useAuthSession } from '@/providers/auth-session';
import { recordSaleMilestone, type SaleMilestoneState } from '@/utils/sale-milestones';

export type InventoryCategory =
  | 'Beverages'
  | 'Produce'
  | 'Dairy'
  | 'Snacks'
  | 'Bakery';

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  location: string;
  price: number;
  isVariablePrice: boolean;
  variableSalePrices: number[];
  onHand: number;
  soldToday: number;
  trend: string;
  lastSoldLabel: string;
};

export type RevenueHistoryEntry = {
  dateKey: string;
  revenue: number;
  unitsSold: number;
  soldItemsCount: number;
};

type InventoryStoreValue = {
  items: InventoryItem[];
  soldItems: InventoryItem[];
  revenueHistory: RevenueHistoryEntry[];
  currentDateKey: string;
  firestoreStatus: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  firestoreError: string | null;
  totalSoldUnits: number;
  totalInventoryUnits: number;
  totalRevenue: number;
  previousTotalSoldUnits: number;
  previousTotalRevenue: number;
  pendingSaleFlights: number[];
  completeSaleFlight: (id: number) => void;
  saleMilestones: SaleMilestoneState;
  completeSaleMilestone: (dateKey: string, total: number) => void;
  addInventoryItem: (id: string) => void;
  removeInventoryItem: (id: string) => void;
  addSoldItem: (id: string, salePriceOverride?: number) => void;
  removeSoldItem: (id: string) => void;
};

type InventorySnapshot = {
  totalSoldUnits: number;
  totalRevenue: number;
};

type PersistedInventoryItem = InventoryItem;

type PersistedInventoryState = {
  currentDateKey: string;
  items: PersistedInventoryItem[];
  revenueHistory: RevenueHistoryEntry[];
};

const STORAGE_KEY = 'inventory-daily-sales-v1';
const FIRESTORE_COLLECTION_NAME = '1';
let storageAvailable = true;

const InventoryStoreContext = createContext<InventoryStoreValue | null>(null);

const fallbackCategories: InventoryCategory[] = [
  'Beverages',
  'Produce',
  'Dairy',
  'Snacks',
  'Bakery',
];

function normalizeItemName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return getLocalDateKey();
}

function toPersistedItems(items: InventoryItem[]): PersistedInventoryItem[] {
  return fromPersistedItems(items);
}

function fromPersistedItems(items: PersistedInventoryItem[]): InventoryItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    location: item.location,
    price: item.price,
    isVariablePrice: item.isVariablePrice ?? false,
    variableSalePrices: item.variableSalePrices ?? [],
    onHand: item.onHand,
    soldToday: item.soldToday,
    trend: item.trend,
    lastSoldLabel: item.lastSoldLabel,
  }));
}

export function getItemRevenue(item: InventoryItem) {
  if (item.isVariablePrice) {
    return item.variableSalePrices.reduce((sum, price) => sum + price, 0);
  }

  return item.soldToday * item.price;
}

export function getItemLastSalePrice(item: InventoryItem) {
  if (!item.isVariablePrice || item.variableSalePrices.length === 0) {
    return null;
  }

  return item.variableSalePrices[item.variableSalePrices.length - 1] ?? null;
}

function buildHistoryEntry(items: InventoryItem[], dateKey: string): RevenueHistoryEntry {
  return {
    dateKey,
    revenue: items.reduce((sum, item) => sum + getItemRevenue(item), 0),
    unitsSold: items.reduce((sum, item) => sum + item.soldToday, 0),
    soldItemsCount: items.filter((item) => item.soldToday > 0).length,
  };
}

function resetItemsForNewDay(items: InventoryItem[]) {
  return items.map((item) => ({
    ...item,
    soldToday: 0,
    variableSalePrices: [],
    lastSoldLabel: 'No sale logged',
  }));
}

function buildFirestoreInventoryItem(
  id: string,
  data: Record<string, unknown>,
  index: number,
  existing?: InventoryItem
): InventoryItem | null {
  const name = typeof data.Name === 'string' ? data.Name.trim() : '';
  const rawPrice = data.Price;
  const parsedPrice =
    typeof rawPrice === 'number'
      ? rawPrice
      : typeof rawPrice === 'string'
        ? Number(rawPrice)
        : NaN;
  const isVariablePrice = Number.isNaN(parsedPrice);
  const price = isVariablePrice ? 0 : parsedPrice;

  if (!name) {
    return null;
  }

  return {
    id,
    name,
    price,
    isVariablePrice: existing?.isVariablePrice ?? isVariablePrice,
    variableSalePrices: existing?.variableSalePrices ?? [],
    sku: existing?.sku ?? `FS-${String(index + 1).padStart(3, '0')}`,
    category: existing?.category ?? fallbackCategories[index % fallbackCategories.length],
    location: existing?.location ?? 'Catalog',
    onHand: existing?.onHand ?? 0,
    soldToday: existing?.soldToday ?? 0,
    trend: existing?.trend ?? '0%',
    lastSoldLabel: existing?.lastSoldLabel ?? 'No sale logged',
  };
}

function normalizeFirestoreError(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeCode = 'code' in error ? String(error.code) : null;
    const maybeMessage = 'message' in error ? String(error.message) : 'Unknown Firestore error.';

    if (maybeCode === 'permission-denied') {
      return 'Unable to access the catalog. Sign in again or contact support.';
    }

    if (maybeCode === 'failed-precondition') {
      return 'Firestore is not fully set up yet. Open Firestore in Firebase Console and finish database setup.';
    }

    return maybeCode ? `${maybeCode}: ${maybeMessage}` : maybeMessage;
  }

  return 'Unknown Firestore error.';
}

function applyDayRollover(
  items: InventoryItem[],
  currentDateKey: string,
  history: RevenueHistoryEntry[]
) {
  const todayKey = getTodayKey();

  if (currentDateKey === todayKey) {
    return { items, history, currentDateKey };
  }

  const completedDay = buildHistoryEntry(items, currentDateKey);
  const hasSales = completedDay.unitsSold > 0 || completedDay.revenue > 0;
  const nextHistory = hasSales
    ? [completedDay, ...history.filter((entry) => entry.dateKey !== currentDateKey)]
    : history;

  return {
    items: resetItemsForNewDay(items),
    history: nextHistory,
    currentDateKey: todayKey,
  };
}

async function safeStorageGetItem(key: string) {
  if (!storageAvailable) {
    return null;
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    storageAvailable = false;
    return null;
  }
}

async function safeStorageSetItem(key: string, value: string) {
  if (!storageAvailable) {
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    storageAvailable = false;
  }
}

export function InventoryStoreProvider({ children }: PropsWithChildren) {
  const { user } = useAuthSession();
  if (!user) return null;

  // Remount all state (including pending animations) whenever the account changes.
  return <AccountInventoryStore key={user.uid} userId={user.uid}>{children}</AccountInventoryStore>;
}

function AccountInventoryStore({ children, userId }: PropsWithChildren<{ userId: string }>) {
  // The old shared key has no owner, so never import it into an account.
  const storageKey = `${STORAGE_KEY}:${userId}`;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pendingSaleFlights, setPendingSaleFlights] = useState<number[]>([]);
  const nextSaleFlightId = useRef(0);
  const [saleMilestones, setSaleMilestones] = useState<SaleMilestoneState>(() => ({
    dateKey: getTodayKey(),
    achieved: [],
    pending: [],
  }));
  const completeSaleMilestone = useCallback((dateKey: string, total: number) => {
    setSaleMilestones((current) => current.dateKey !== dateKey ? current : {
      ...current,
      pending: current.pending.filter((milestone) => milestone !== total),
    });
  }, []);
  const completeSaleFlight = useCallback((id: number) => {
    setPendingSaleFlights((current) => current.filter((flightId) => flightId !== id));
  }, []);
  const [currentDateKey, setCurrentDateKey] = useState(getTodayKey());
  const [revenueHistory, setRevenueHistory] = useState<RevenueHistoryEntry[]>([]);
  const [firestoreStatus, setFirestoreStatus] = useState<
    'idle' | 'loading' | 'success' | 'empty' | 'error'
  >('idle');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<InventorySnapshot>({ totalSoldUnits: 0, totalRevenue: 0 });
  const hasStoredInventory = useRef(false);
  const [hasFinishedHydration, setHasFinishedHydration] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const raw = await safeStorageGetItem(storageKey);

        if (!raw) {
          return;
        }

        hasStoredInventory.current = true;

        const parsed = JSON.parse(raw) as PersistedInventoryState;
        const hydratedItems = fromPersistedItems(parsed.items);
        const resolvedHistory =
          parsed.revenueHistory && parsed.revenueHistory.length > 0
            ? parsed.revenueHistory
            : [];

        const rolled = applyDayRollover(
          hydratedItems,
          parsed.currentDateKey ?? getTodayKey(),
          resolvedHistory
        );

        if (!isMounted) {
          return;
        }

        setItems(rolled.items);
        setRevenueHistory(rolled.history);
        setCurrentDateKey(rolled.currentDateKey);
        setPreviousSnapshot({
          totalSoldUnits: rolled.items.reduce((sum, item) => sum + item.soldToday, 0),
          totalRevenue: rolled.items.reduce((sum, item) => sum + getItemRevenue(item), 0),
        });
      } catch {
        // Ignore storage hydration errors and start with empty account state.
      } finally {
        if (isMounted) {
          setHasFinishedHydration(true);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hasFinishedHydration) {
      return;
    }

    let isMounted = true;

    async function syncFirestoreItems() {
      setFirestoreStatus('loading');
      setFirestoreError(null);
      console.info('[Firestore] Starting inventory sync from collection:', FIRESTORE_COLLECTION_NAME);

      try {
        const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTION_NAME));
        console.info('[Firestore] Documents fetched:', snapshot.size);

        if (!isMounted) {
          return;
        }

        if (snapshot.empty) {
          setFirestoreStatus('empty');
          console.warn(
            '[Firestore] Collection returned 0 documents. Verify collection name "1" and that docs exist.'
          );
          return;
        }

        setItems((currentItems) => {
          const existingById = new Map(currentItems.map((item) => [item.id, item] as const));
          const existingByName = new Map(
            currentItems.map((item) => [normalizeItemName(item.name), item] as const)
          );

          const remoteItems = snapshot.docs
            .map((doc, index) => {
              const existing =
                existingById.get(doc.id) ?? existingByName.get(normalizeItemName(String(doc.data().Name ?? '')));

              const mapped = buildFirestoreInventoryItem(
                doc.id,
                doc.data() as Record<string, unknown>,
                index,
                existing
              );

              if (!mapped) {
                console.warn('[Firestore] Skipping invalid document:', doc.id, doc.data());
              }

              return mapped;
            })
            .filter((item): item is InventoryItem => item !== null);

          console.info('[Firestore] Valid inventory items mapped:', remoteItems.length);

          if (remoteItems.length === 0) {
            setFirestoreStatus('error');
            setFirestoreError('Documents were found, but none matched the required field "Name".');
            console.error(
              '[Firestore] No valid documents matched expected schema. Expected field: Name (string). Price may be omitted for variable-price items.'
            );
            return currentItems;
          }

          setFirestoreStatus('success');
          return remoteItems.length > 0 ? remoteItems : currentItems;
        });

        if (!hasStoredInventory.current) {
          setCurrentDateKey(getTodayKey());
          setRevenueHistory([]);
          setPreviousSnapshot({
            totalSoldUnits: 0,
            totalRevenue: 0,
          });
        }
      } catch (error) {
        const message = normalizeFirestoreError(error);
        console.error('[Firestore] Inventory sync failed:', error);

        if (isMounted) {
          setFirestoreStatus('error');
          setFirestoreError(message);
        }
      }
    }

    void syncFirestoreItems();

    return () => {
      isMounted = false;
    };
  }, [hasFinishedHydration]);

  useEffect(() => {
    if (!hasFinishedHydration) {
      return;
    }

    void safeStorageSetItem(
      storageKey,
      JSON.stringify({
        currentDateKey,
        items: toPersistedItems(items),
        revenueHistory,
      } satisfies PersistedInventoryState)
    );
  }, [currentDateKey, hasFinishedHydration, items, revenueHistory, storageKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      setItems((currentItems) => {
        let nextItems = currentItems;

        setCurrentDateKey((currentKey) => {
          const rolled = applyDayRollover(currentItems, currentKey, revenueHistory);

          nextItems = rolled.items;
          setRevenueHistory(rolled.history);
          setPreviousSnapshot({
            totalSoldUnits: rolled.items.reduce((sum, item) => sum + item.soldToday, 0),
            totalRevenue: rolled.items.reduce((sum, item) => sum + getItemRevenue(item), 0),
          });

          return rolled.currentDateKey;
        });

        return nextItems;
      });
    });

    return () => {
      subscription.remove();
    };
  }, [revenueHistory]);

  const value = useMemo<InventoryStoreValue>(() => {
    const soldItems = items.filter((item) => item.soldToday > 0);
    const totalSoldUnits = items.reduce((sum, item) => sum + item.soldToday, 0);
    const totalInventoryUnits = items.reduce((sum, item) => sum + item.onHand, 0);
    const totalRevenue = items.reduce((sum, item) => sum + getItemRevenue(item), 0);

    return {
      items,
      soldItems,
      revenueHistory: [...revenueHistory].sort((left, right) =>
        right.dateKey.localeCompare(left.dateKey)
      ),
      currentDateKey,
      firestoreStatus,
      firestoreError,
      totalSoldUnits,
      totalInventoryUnits,
      totalRevenue,
      previousTotalSoldUnits: previousSnapshot.totalSoldUnits,
      previousTotalRevenue: previousSnapshot.totalRevenue,
      pendingSaleFlights,
      completeSaleFlight,
      saleMilestones,
      completeSaleMilestone,
      addInventoryItem(id) {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, onHand: item.onHand + 1 } : item))
        );
      },
      removeInventoryItem(id) {
        setItems((current) =>
          current.map((item) =>
            item.id === id && item.onHand > 0 ? { ...item, onHand: item.onHand - 1 } : item
          )
        );
      },
      addSoldItem(id, salePriceOverride) {
        if (!items.some((item) => item.id === id)) {
          return;
        }

        const flightId = ++nextSaleFlightId.current;
        setPendingSaleFlights((current) => [...current, flightId]);
        setItems((current) => {
          const rolled = applyDayRollover(current, currentDateKey, revenueHistory);
          const nextTotal = rolled.items.reduce((sum, item) => sum + item.soldToday, 0) + 1;
          setSaleMilestones((milestones) => recordSaleMilestone(milestones, rolled.currentDateKey, nextTotal));
          setRevenueHistory(rolled.history);
          setCurrentDateKey(rolled.currentDateKey);

          setPreviousSnapshot({
            totalSoldUnits: rolled.items.reduce((sum, item) => sum + item.soldToday, 0),
            totalRevenue: rolled.items.reduce((sum, item) => sum + getItemRevenue(item), 0),
          });

          return rolled.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  soldToday: item.soldToday + 1,
                  variableSalePrices:
                    item.isVariablePrice && typeof salePriceOverride === 'number'
                      ? [...item.variableSalePrices, salePriceOverride]
                      : item.variableSalePrices,
                  lastSoldLabel: 'just now',
                }
              : item
          );
        });
      },
      removeSoldItem(id) {
        setItems((current) => {
          const rolled = applyDayRollover(current, currentDateKey, revenueHistory);
          setRevenueHistory(rolled.history);
          setCurrentDateKey(rolled.currentDateKey);

          setPreviousSnapshot({
            totalSoldUnits: rolled.items.reduce((sum, item) => sum + item.soldToday, 0),
            totalRevenue: rolled.items.reduce((sum, item) => sum + getItemRevenue(item), 0),
          });

          return rolled.items.map((item) =>
            item.id === id && item.soldToday > 0
              ? {
                  ...item,
                  soldToday: item.soldToday - 1,
                  variableSalePrices: item.isVariablePrice
                    ? item.variableSalePrices.slice(0, -1)
                    : item.variableSalePrices,
                  lastSoldLabel: item.soldToday - 1 > 0 ? item.lastSoldLabel : 'No sale logged',
                }
              : item
          );
        });
      },
    };
  }, [completeSaleFlight, completeSaleMilestone, currentDateKey, firestoreError, firestoreStatus, items, pendingSaleFlights, previousSnapshot, revenueHistory, saleMilestones]);

  return <InventoryStoreContext.Provider value={value}>{children}</InventoryStoreContext.Provider>;
}

export function useInventoryStore() {
  const context = useContext(InventoryStoreContext);

  if (!context) {
    throw new Error('useInventoryStore must be used within an InventoryStoreProvider');
  }

  return context;
}
