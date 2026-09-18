import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, User, OrderStatus, EmailVerification } from '../types';
import { initialProducts } from '../data/initialData';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (using custom database ID if specified in config)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Sync Status listener
type SyncStatus = 'connecting' | 'connected' | 'offline' | 'error';
let currentSyncStatus: SyncStatus = 'connecting';
const statusListeners = new Set<(status: SyncStatus) => void>();

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  listener(currentSyncStatus);
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function updateStatus(status: SyncStatus) {
  currentSyncStatus = status;
  statusListeners.forEach(listener => listener(status));
}

export const FirebaseService = {
  getSyncStatus(): SyncStatus {
    return currentSyncStatus;
  },

  // Real-time listener for Products
  subscribeProducts(callback: (products: Product[]) => void): Unsubscribe {
    const productsCol = collection(db, 'products');
    
    // First check if products need seeding
    getDocs(productsCol)
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('[Firebase] Seeding initial products to Firestore...');
          const batch = writeBatch(db);
          initialProducts.forEach(prod => {
            const ref = doc(db, 'products', prod.id);
            batch.set(ref, prod);
          });
          return batch.commit();
        }
      })
      .then(() => {
        updateStatus('connected');
      })
      .catch(err => {
        console.warn('[Firebase] Products check error:', err);
        updateStatus('error');
      });

    // Real-time snapshot listener
    return onSnapshot(
      productsCol,
      snapshot => {
        updateStatus('connected');
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => d.data() as Product);
          callback(list);
        } else {
          // If empty in cloud, fallback to initial products
          callback(initialProducts);
        }
      },
      error => {
        console.warn('[Firebase] Product snapshot error:', error);
        updateStatus('error');
      }
    );
  },

  // Save or update a product in Firestore
  async saveProduct(product: Product): Promise<void> {
    try {
      const ref = doc(db, 'products', product.id);
      await setDoc(ref, product, { merge: true });
      updateStatus('connected');
    } catch (err) {
      console.error('[Firebase] Failed to save product:', err);
      throw err;
    }
  },

  // Delete a product in Firestore
  async deleteProduct(productId: string): Promise<void> {
    try {
      const ref = doc(db, 'products', productId);
      await deleteDoc(ref);
      updateStatus('connected');
    } catch (err) {
      console.error('[Firebase] Failed to delete product:', err);
      throw err;
    }
  },

  // Real-time listener for Orders
  subscribeOrders(
    initialOrders: Order[], 
    callback: (orders: Order[]) => void
  ): Unsubscribe {
    const ordersCol = collection(db, 'orders');

    // First check if demo orders need seeding
    getDocs(ordersCol)
      .then(snapshot => {
        if (snapshot.empty && initialOrders.length > 0) {
          console.log('[Firebase] Seeding initial orders to Firestore...');
          const batch = writeBatch(db);
          initialOrders.forEach(ord => {
            const ref = doc(db, 'orders', ord.id);
            batch.set(ref, ord);
          });
          return batch.commit();
        }
      })
      .then(() => {
        updateStatus('connected');
      })
      .catch(err => {
        console.warn('[Firebase] Orders check error:', err);
      });

    // Real-time snapshot listener
    return onSnapshot(
      ordersCol,
      snapshot => {
        updateStatus('connected');
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => d.data() as Order);
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(list);
        } else {
          callback(initialOrders);
        }
      },
      error => {
        console.warn('[Firebase] Order snapshot error:', error);
      }
    );
  },

  // Save an order in Firestore
  async saveOrder(order: Order): Promise<void> {
    try {
      const ref = doc(db, 'orders', order.id);
      await setDoc(ref, order);
      updateStatus('connected');
    } catch (err) {
      console.error('[Firebase] Failed to save order:', err);
      throw err;
    }
  },

  // Update order status in Firestore
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const ref = doc(db, 'orders', orderId);
      await setDoc(ref, { orderStatus: status }, { merge: true });
      updateStatus('connected');
    } catch (err) {
      console.error('[Firebase] Failed to update order status:', err);
      throw err;
    }
  },

  // Save or update user
  async saveUser(user: User): Promise<void> {
    try {
      const ref = doc(db, 'users', user.id);
      await setDoc(ref, user, { merge: true });
    } catch (err) {
      console.error('[Firebase] Failed to save user:', err);
    }
  },

  // Send or generate a 4-digit verification code stored in Firebase
  async sendVerificationCode(
    email: string, 
    purpose: 'register' | 'forgot_password', 
    tempUserData?: {
      name: string;
      phone: string;
      password?: string;
      enable2FA?: boolean;
    }
  ): Promise<{ code: string; expiresAt: number }> {
    const cleanEmail = email.trim().toLowerCase();
    // Generate secure 4-digit code (1000 - 9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const docId = `${cleanEmail.replace(/[^a-zA-Z0-9_]/g, '_')}_${purpose}`;
    const verificationData: EmailVerification = {
      id: docId,
      email: cleanEmail,
      code,
      purpose,
      expiresAt,
      createdAt: new Date().toISOString(),
      verified: false,
      tempUserData: tempUserData || undefined,
    };

    try {
      const ref = doc(db, 'email_verifications', docId);
      await setDoc(ref, verificationData);
      console.log(`[Firebase OTP] 4-digit code sent for ${cleanEmail} (${purpose}): ${code}`);
    } catch (err) {
      console.warn('[Firebase] Firestore OTP save error (falling back to local memory):', err);
    }

    let delivery: { delivered: boolean; method?: string; reason?: string; error?: string } = {
      delivered: false,
    };

    // Dispatch real email via server endpoint
    try {
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, purpose }),
      });
      if (response.ok) {
        delivery = await response.json();
      }
    } catch (e) {
      console.warn('[Firebase/API] Error calling send-email-otp:', e);
    }

    return { code, expiresAt, delivery };
  },

  // Verify 4-digit code from Firebase
  async verifyEmailCode(
    email: string, 
    code: string, 
    purpose: 'register' | 'forgot_password'
  ): Promise<{ success: boolean; message: string; data?: EmailVerification }> {
    const cleanEmail = email.trim().toLowerCase();
    const docId = `${cleanEmail.replace(/[^a-zA-Z0-9_]/g, '_')}_${purpose}`;

    try {
      const ref = doc(db, 'email_verifications', docId);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        const data = snap.data() as EmailVerification;
        if (Date.now() > data.expiresAt) {
          return { success: false, message: 'কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় কোড পাঠান।' };
        }
        if (data.code.trim() !== code.trim()) {
          return { success: false, message: 'ভুল কোড! আপনার ইমেইলে পাঠানো সঠিক ৪ সংখ্যার কোড লিখুন।' };
        }

        // Mark as verified
        await setDoc(ref, { verified: true }, { merge: true });
        return { success: true, message: 'কোড সফলভাবে যাচাই হয়েছে।', data };
      }
    } catch (err) {
      console.warn('[Firebase] Error reading verification code from Firestore:', err);
    }

    // Return failure if code doesn't exist in Firestore
    return { success: false, message: 'যাচাইকরণ কোড খুঁজে পাওয়া যায়নি বা ভুল কোড দেওয়া হয়েছে।' };
  },

  // Update user password in Firestore & local storage
  async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      let found = false;

      for (const d of snap.docs) {
        const u = d.data() as User;
        if (u.email && u.email.trim().toLowerCase() === cleanEmail) {
          await setDoc(doc(db, 'users', d.id), { password: newPassword }, { merge: true });
          found = true;
          break;
        }
      }
      return found;
    } catch (err) {
      console.error('[Firebase] Failed to update password in Firestore:', err);
      return false;
    }
  },

  // Find user by email in Firestore
  async findUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      for (const d of snap.docs) {
        const u = d.data() as User;
        if (u.email && u.email.trim().toLowerCase() === cleanEmail) {
          return u;
        }
      }
    } catch (err) {
      console.warn('[Firebase] Error finding user in Firestore:', err);
    }
    return null;
  }
};
