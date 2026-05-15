import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Check if a store with the same name already exists for this owner
 * Prevents duplicate store names
 */
export async function checkDuplicateStoreName(storeName: string, ownerId: string, excludeStoreId?: string): Promise<boolean> {
  try {
    const storesRef = collection(db, 'stores');
    const q = query(
      storesRef,
      where('name', '==', storeName),
      where('ownerId', '==', ownerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // If excludeStoreId is provided, check if the only match is the store being updated
    if (excludeStoreId && querySnapshot.docs.length === 1) {
      return querySnapshot.docs[0].id === excludeStoreId ? false : true;
    }
    
    return querySnapshot.docs.length > 0;
  } catch (error) {
    console.error('Error checking duplicate store name:', error);
    throw new Error('Failed to validate store name uniqueness');
  }
}

/**
 * Get stores with low item count (2 or fewer items)
 * These stores can be deleted by the owner
 */
export async function getLowItemStores(ownerId: string) {
  try {
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where('ownerId', '==', ownerId));
    
    const querySnapshot = await getDocs(q);
    const lowItemStores = [];
    
    for (const doc of querySnapshot.docs) {
      const store = doc.data();
      const itemCount = store.items?.length || 0;
      
      if (itemCount <= 2) {
        lowItemStores.push({
          id: doc.id,
          ...store,
          itemCount
        });
      }
    }
    
    return lowItemStores;
  } catch (error) {
    console.error('Error fetching low item stores:', error);
    throw new Error('Failed to fetch low item stores');
  }
}

/**
 * Validate store has minimum required items
 * Returns true if store is valid (has > 2 items)
 */
export async function isStoreValid(storeId: string): Promise<boolean> {
  try {
    const storeRef = await import('firebase/firestore').then(m => 
      m.getDoc(m.doc(db, 'stores', storeId))
    );
    
    if (!storeRef.exists()) {
      return false;
    }
    
    const itemCount = storeRef.data()?.items?.length || 0;
    return itemCount > 2;
  } catch (error) {
    console.error('Error validating store:', error);
    return false;
  }
}
