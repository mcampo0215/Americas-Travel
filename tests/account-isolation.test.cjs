const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, console, Date });
  return exports;
}

test('registration never signs into the primary session and cleans up on success or failure', async () => {
  for (const failureAt of [null, 'create', 'profile']) {
    const primary = { currentUser: null };
    const temporary = {};
    const events = [];
    const { registerAccount } = load('src/lib/register-account.ts', {
      './firebase': {},
      'firebase/app': {
        getApp: () => ({ options: {} }), initializeApp: () => temporary,
        deleteApp: async (app) => { assert.equal(app, temporary); events.push('delete'); },
      },
      'firebase/auth': {
        inMemoryPersistence: 'memory',
        initializeAuth: (app, options) => {
          assert.equal(app, temporary); assert.equal(options.persistence, 'memory'); return temporary;
        },
        createUserWithEmailAndPassword: async (auth) => {
          assert.equal(auth, temporary);
          if (failureAt === 'create') throw new Error('create failed');
          return { user: {} };
        },
        updateProfile: async () => { if (failureAt === 'profile') throw new Error('profile failed'); },
        signOut: async (auth) => { assert.equal(auth, temporary); events.push('signOut'); },
      },
    });
    if (failureAt) await assert.rejects(registerAccount('a@example.com', 'password', 'A'));
    else await registerAccount('a@example.com', 'password', 'A');
    assert.equal(primary.currentUser, null);
    assert.deepEqual(events, ['signOut', 'delete']);
  }
});

test('native authentication uses persistent storage across app restarts', () => {
  const storage = {};
  const persistence = {};
  const firebaseApp = {};
  let initializedWith;

  const { auth } = load('src/lib/auth.native.ts', {
    './firebase': {},
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'firebase/app': { getApp: () => firebaseApp },
    'firebase/auth': {
      getAuth: () => { throw new Error('Persistent auth should initialize on first launch'); },
      getReactNativePersistence: (receivedStorage) => {
        assert.equal(receivedStorage, storage);
        return persistence;
      },
      initializeAuth: (app, options) => {
        assert.equal(app, firebaseApp);
        initializedWith = options;
        return { app };
      },
    },
  });

  assert.equal(initializedWith.persistence, persistence);
  assert.equal(auth.app, firebaseApp);
});

test('a restored authenticated session skips onboarding', () => {
  const { resolveAuthDestination } = load('src/utils/auth-routing.ts', {});

  assert.equal(resolveAuthDestination(false, false), 'loading');
  assert.equal(resolveAuthDestination(false, true), 'loading');
  assert.equal(resolveAuthDestination(true, true), 'signed-in');
  assert.equal(resolveAuthDestination(true, false), 'signed-out');
});

test('accounts restore only their own sales, including after switching back', async () => {
  const storage = new Map([['inventory-daily-sales-v1', JSON.stringify({ items: [{ soldToday: 999 }] })]]);
  let user = { uid: 'alice' };
  let slots, cursor, effects, dirty, value;
  const jsx = (type, props, key) => ({ type, props, key });
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useContext: () => null,
    useState: (initial) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], (next) => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; dirty = true; }];
    },
    useRef: (initial) => { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: (fn, deps) => {
      const i = cursor++;
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i][j])) { slots[i] = deps; effects.push(fn); }
    },
  };
  const { InventoryStoreProvider } = load('src/providers/inventory-store.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, data) => storage.set(key, data),
    } },
    'firebase/firestore': { collection: () => {}, getDocs: async () => ({
      size: 1, empty: false, docs: [{ id: 'product', data: () => ({ Name: 'Product', Price: 5, soldToday: 888 }) }],
    }) },
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    '@/lib/firebase': { db: {} },
    '@/providers/auth-session': { useAuthSession: () => ({ user }) },
    '@/utils/sale-milestones': { recordSaleMilestone: (state) => state },
  });
  let tree;
  async function flush() {
    for (let i = 0; i < 12; i++) {
      if (dirty) {
        dirty = false; cursor = 0; effects = [];
        value = tree.type(tree.props).props.value;
        effects.forEach((fn) => fn());
      }
      await new Promise(setImmediate);
    }
  }
  async function mount(uid) {
    user = { uid }; tree = InventoryStoreProvider({ children: null });
    assert.equal(tree.key, uid);
    slots = []; dirty = true; await flush();
  }
  await mount('alice');
  assert.equal(value.totalSoldUnits, 0);
  assert.equal(value.revenueHistory.length, 0);
  value.addSoldItem('product'); await flush();
  assert.equal(value.totalRevenue, 5);
  await mount('bob');
  assert.equal(value.totalSoldUnits, 0);
  assert.equal(value.pendingSaleFlights.length, 0);
  value.addSoldItem('product'); await flush();
  value.addSoldItem('product'); await flush();
  assert.equal(value.totalRevenue, 10);
  await mount('alice');
  assert.equal(value.totalSoldUnits, 1);
  assert.equal(value.totalRevenue, 5);
  assert.equal(value.revenueHistory.length, 0);
  user = null;
  assert.equal(InventoryStoreProvider({ children: null }), null);
});

test('password changes require valid input and successful reauthentication', async () => {
  const events = [];
  let rejectAuthentication = false;
  const user = { email: 'alice@example.com' };
  const { changePassword } = load('src/lib/change-password.ts', {
    'firebase/auth': {
      EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
      reauthenticateWithCredential: async (account, credential) => {
        assert.equal(account, user);
        assert.equal(credential.email, user.email);
        assert.equal(credential.password, 'current-password');
        events.push('reauthenticate');
        if (rejectAuthentication) throw new Error('Incorrect password');
      },
      updatePassword: async (account, password) => {
        assert.equal(account, user);
        assert.equal(password, 'new-password');
        events.push('update');
      },
    },
  });
  await assert.rejects(changePassword(user, '', 'new-password', 'new-password'));
  await assert.rejects(changePassword(user, 'current-password', 'short', 'short'));
  await assert.rejects(changePassword(user, 'current-password', 'new-password', 'mismatch'));
  await assert.rejects(changePassword(user, 'current-password', 'current-password', 'current-password'));
  assert.deepEqual(events, []);
  rejectAuthentication = true;
  await assert.rejects(changePassword(user, 'current-password', 'new-password', 'new-password'));
  assert.deepEqual(events, ['reauthenticate']);
  events.length = 0;
  rejectAuthentication = false;
  await changePassword(user, 'current-password', 'new-password', 'new-password');
  assert.deepEqual(events, ['reauthenticate', 'update']);
});
