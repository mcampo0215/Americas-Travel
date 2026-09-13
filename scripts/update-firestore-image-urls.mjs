// Run with Application Default Credentials for a catalog administrator.
// Never bundle this script or administrator credentials into the Expo app.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'americas-travel',
});
const db = getFirestore(app);

const COLLECTION_NAME = '1';

const imageUrlsByName = new Map([
  [
    'cold brew bottle',
    'https://images.wegmans.com/is/image/wegmanscsprod/911531_PrimaryImage?v=3eb07b56a4a5d87ad4d9b62a953eaf5c81556adf',
  ],
  [
    'greek yogurt 4-pack',
    'https://images.wegmans.com/is/image/wegmanscsprod/43720_PrimaryImage?v=52b37b52863269e2f9cc5d4114eb2b79624b2191',
  ],
  [
    'organic banana box',
    'https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_de3b14d5-9d53-48a7-ac33-5c89cf57b3c0.png',
  ],
  [
    'sourdough loaf',
    'https://images.wegmans.com/is/image/wegmanscsprod/55904_PrimaryImage?v=f719bffb4706e6320f3336ef73f6f8f526a90177',
  ],
  [
    'honey granola bars',
    'https://www.instacart.com/assets/domains/product-image/file/large_1d2fb8aa-66b4-4da5-af01-24200eab0dc7.png',
  ],
  [
    'sparkling water 8-pack',
    'https://images.cdn.shoprite.com/cell/00075720446216_1',
  ],
  [
    'cheddar snack packs',
    'https://tb-static.uber.com/prod/image-proc/processed_images/255f6dbd0d0f784f78a87d26d49eb8e0/0e5313be7a8831b8ed60f8dab3c2df10.jpeg',
  ],
  [
    'vanilla almond milk',
    'https://images.wegmans.com/is/image/wegmanscsprod/390816_PrimaryImage?v=ac1612610a387840653f53773e35550663c7323d',
  ],
]);

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

async function main() {
  const snapshot = await db.collection(COLLECTION_NAME).get();
  let updated = 0;
  let skippedExisting = 0;
  let skippedUnknown = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const name = normalizeName(data.Name);
    const imageUrl = imageUrlsByName.get(name);
    const currentImageUrl =
      typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0
        ? data.imageUrl.trim()
        : null;

    if (currentImageUrl) {
      skippedExisting += 1;
      console.info(`[skip-existing] ${docSnap.id} (${data.Name})`);
      continue;
    }

    if (!imageUrl) {
      skippedUnknown += 1;
      console.info(`[skip-unknown] ${docSnap.id} (${data.Name})`);
      continue;
    }

    await docSnap.ref.update({ imageUrl });
    updated += 1;
    console.info(`[updated] ${docSnap.id} (${data.Name}) -> ${imageUrl}`);
  }

  console.info(
    JSON.stringify(
      {
        collection: COLLECTION_NAME,
        updated,
        skippedExisting,
        skippedUnknown,
        totalDocs: snapshot.size,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('[firestore-image-update] failed', error);
  process.exitCode = 1;
});
