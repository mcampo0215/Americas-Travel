import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-americas-travel',
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), '1', 'product'), { Name: 'Product', Price: 5 });
  });
});
after(async () => { await environment?.cleanup(); });

test('anonymous clients cannot read or write the catalog', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(db, '1')));
  await assertFails(getDoc(doc(db, '1', 'product')));
  await assertFails(setDoc(doc(db, '1', 'new'), { Name: 'Unauthorized' }));
});

test('signed-in users can read products but cannot create, edit, or delete them', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  await assertSucceeds(getDocs(collection(db, '1')));
  await assertSucceeds(getDoc(doc(db, '1', 'product')));
  await assertFails(setDoc(doc(db, '1', 'new'), { Name: 'Unauthorized' }));
  await assertFails(updateDoc(doc(db, '1', 'product'), { Price: 0 }));
  await assertFails(deleteDoc(doc(db, '1', 'product')));
});

test('other collections and catalog subcollections remain private', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  for (const path of ['users/bob', 'sales/private', '1/product/sales/private']) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { sales: 100 }));
  }
});
