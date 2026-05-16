import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

const provider = new GoogleAuthProvider();

const getPseudoEmail = (phone: string) => `${phone}@general-store.internal`;

const convertTimestamps = (data: any) => {
  if (!data) return data;
  const newData = { ...data };
  Object.keys(newData).forEach(key => {
    if (newData[key] && typeof newData[key] === 'object' && newData[key].toDate) {
      newData[key] = newData[key].toDate();
    }
  });
  return newData;
};

export const api = {
  // Auth
  async login({ phone, password }: any) {
    try {
      const email = getPseudoEmail(phone);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      return { user: convertTimestamps(docSnap.data()) };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid phone number or password');
      }
      throw error;
    }
  },

  async register({ phone, password, role, name, address }: any) {
    try {
      const email = getPseudoEmail(phone);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const profile = {
        id: user.uid,
        phone,
        name: name || '',
        address: address || '',
        role: role || 'customer',
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', user.uid), profile);
      // For immediate use, we can't easy convert serverTimestamp() before it roundtrips
      return { user: { ...profile, createdAt: new Date() } };
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This phone number is already registered');
      }
      throw error;
    }
  },

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const profile = {
          id: user.uid,
          phone: user.phoneNumber || '',
          name: user.displayName || '',
          role: 'customer', // Default role
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, profile);
        return { user: { ...profile, createdAt: new Date() } };
      }
      
      return { user: convertTimestamps(docSnap.data()) };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    await signOut(auth);
  },

  // Stores
  async getStores() {
    const path = 'stores';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getMyStore() {
    if (!auth.currentUser) return null;
    const path = 'stores';
    try {
      // First try to get by UID as document ID (the new standard)
      const uDoc = await getDoc(doc(db, 'stores', auth.currentUser.uid));
      if (uDoc.exists()) {
        return { id: uDoc.id, ...convertTimestamps(uDoc.data()) };
      }

      // Fallback: search by ownerId (for backward compatibility)
      const q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const stores = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
      return stores[0];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async cleanupDuplicateStores() {
    if (!auth.currentUser) return { success: false, message: 'Not authenticated' };
    const uid = auth.currentUser.uid;
    try {
      const q = query(collection(db, 'stores'), where('ownerId', '==', uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: true, message: 'No stores found' };

      const stores = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      // Check if we have a UID-based store
      const uidStore = stores.find(s => s.id === uid);
      
      if (stores.length === 1 && uidStore) return { success: true, message: 'Correct state' };

      // Find the "best" store (one with products or most products)
      const storesWithCounts = [];
      for (const store of stores) {
        const pq = query(collection(db, 'products'), where('storeId', '==', store.id));
        const psnap = await getDocs(pq);
        storesWithCounts.push({ ...store, productCount: psnap.size });
      }

      const storeToKeep = storesWithCounts.find(s => s.productCount === 4) || 
                          storesWithCounts.sort((a, b) => b.productCount - a.productCount)[0];

      // If the store to keep is NOT the UID store, migrate it
      if (storeToKeep.id !== uid) {
        const { id: oldId, productCount, ...storeData } = storeToKeep as any;
        // 1. Create/Update UID store
        await setDoc(doc(db, 'stores', uid), {
          ...storeData,
          ownerId: uid,
          updatedAt: serverTimestamp(),
          createdAt: storeData.createdAt || serverTimestamp()
        });

        // 2. Migrate products
        const pq = query(collection(db, 'products'), where('storeId', '==', oldId));
        const psnap = await getDocs(pq);
        for (const p of psnap.docs) {
          await updateDoc(doc(db, 'products', p.id), { storeId: uid });
        }

        // 3. Migrate orders
        const oq = query(collection(db, 'orders'), where('storeId', '==', oldId));
        const osnap = await getDocs(oq);
        for (const o of osnap.docs) {
          await updateDoc(doc(db, 'orders', o.id), { storeId: uid });
        }
      }

      // Delete all other stores
      for (const s of stores) {
        if (s.id !== uid) {
          await deleteDoc(doc(db, 'stores', s.id));
        }
      }

      return { success: true, kept: uid };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { success: false, error };
    }
  },

  async getStoreById(id: string) {
    const path = `stores/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'stores', id));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveStore(data: any) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const uid = auth.currentUser.uid;
    const path = 'stores';
    try {
      const storeData = {
        ...data,
        ownerId: uid,
        updatedAt: serverTimestamp(),
      };

      // Remove id from payload if it exists
      delete storeData.id;
      
      // Use UID as document ID to guarantee uniqueness per owner
      const docRef = doc(db, 'stores', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, storeData);
      } else {
        await setDoc(docRef, {
          ...storeData,
          createdAt: serverTimestamp(),
        });
      }
      
      return { id: uid, ...storeData };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Products
  async getProducts(storeId?: string) {
    const path = 'products';
    try {
      let q = collection(db, path) as any;
      if (storeId) {
        q = query(q, where('storeId', '==', storeId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async addProduct(data: any) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = 'products';
    try {
      const prodData = {
        ...data,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, path), prodData);
      return { id: docRef.id, ...prodData };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateProduct(id: string, data: any) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), data);
      return { id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Orders
  async getOrders() {
    if (!auth.currentUser) return [];
    const path = 'orders';
    try {
      // Find orders for my store if admin, or my own orders if customer
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      
      let q;
      // Heuristic: check role OR if they own a store
      if (userData?.role === 'admin') {
        q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
      } else {
        // Double check if they are a store owner even if role is missing
        const storeQ = query(collection(db, 'stores'), where('ownerId', '==', auth.currentUser.uid));
        const storeSnap = await getDocs(storeQ);
        
        if (!storeSnap.empty) {
          q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
        } else {
          q = query(collection(db, path), where('customerId', '==', auth.currentUser.uid));
        }
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        return { id: d.id, ...convertTimestamps(d.data()) };
      }).sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA; // Descending
      });
    } catch (error) {
      console.error('getOrders error:', error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createOrder(data: any) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = 'orders';
    try {
      // Need ownerId for the store to enforce security rules
      const storeSnap = await getDoc(doc(db, 'stores', data.storeId));
      if (!storeSnap.exists()) throw new Error('Store not found');
      const storeData = storeSnap.data() as any;

      const orderData = {
        ...data,
        customerId: auth.currentUser.uid,
        ownerId: storeData.ownerId,
        status: 'pending',
        paymentStatus: data.paymentMethod === 'qr' ? 'unpaid' : 'unpaid',
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, path), orderData);
      return { id: docRef.id, ...orderData };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateOrderStatus(id: string, status: string) {
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      return { id, status };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updatePaymentStatus(id: string, paymentStatus: 'paid' | 'unpaid') {
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), { paymentStatus });
      return { id, paymentStatus };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Payments (Placeholder for now, Razorpay might still need server logic or direct client)
  async createPaymentOrder(amount: number, receipt: string) {
    // This still likely needs a server proxy to call Razorpay API safely
    // I will keep the fetch for now but redirect to the server
    const res = await fetch(`/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt }),
    });
    return res.json();
  },

  async verifyPayment(data: any) {
    const res = await fetch(`/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
