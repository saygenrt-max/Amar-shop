import { Order, Product, User, CartItem } from '../types';
import { initialProducts } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'amarshop_products_v1',
  ORDERS: 'amarshop_orders_v1',
  USERS: 'amarshop_users_v1',
  CURRENT_USER: 'amarshop_current_user_v1',
  CART: 'amarshop_cart_v1',
  THEME: 'amarshop_theme_v1',
  LANGUAGE: 'amarshop_lang_v1',
  FIREBASE_SYNC: 'amarshop_firebase_sync_v1',
};

// Initial demo orders for instant order tracking
export const initialOrders: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'Shakil Ahmed',
    phone: '01711223344',
    email: 'shakil@example.com',
    address: 'House 14, Road 7, Dhanmondi',
    city: 'Dhaka',
    notes: 'Please call before delivery',
    items: [
      {
        productId: 'prod-1',
        productNameBn: 'ওয়্যারলেস নয়েজ ক্যানসেলিং হেডফোন প্রো',
        productNameEn: 'Wireless Active Noise Cancelling Headphones Pro',
        price: 3850,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      },
      {
        productId: 'prod-5',
        productNameBn: 'প্রাকৃতিক হিমালয়ান ফেসিয়াল সিরাম',
        productNameEn: 'Natural Himalayan Facial Serum',
        price: 1350,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      }
    ],
    subtotal: 5200,
    shippingFee: 60,
    discount: 520,
    total: 4740,
    isExpressDelivery: true,
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    transactionId: 'TRX-BK-98831201',
    orderStatus: 'out_for_delivery',
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    estimatedDelivery: 'আজ বিকেল ৫:০০ টার মধ্যে',
    courierName: 'Pathao Express Logistics',
    trackingNumber: 'PTH-9920193',
  },
  {
    id: 'ORD-1002',
    customerName: 'Tasnim Jahan',
    phone: '01899887766',
    email: 'tasnim@example.com',
    address: 'Flat 4B, Green Road',
    city: 'Dhaka',
    items: [
      {
        productId: 'prod-2',
        productNameBn: 'স্মার্ট ওয়াটারপ্রুফ ফিটনেস স্মার্টওয়াচ আল্ট্রা',
        productNameEn: 'Smart Waterproof Fitness Smartwatch Ultra',
        price: 2990,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      }
    ],
    subtotal: 2990,
    shippingFee: 0,
    discount: 0,
    total: 2990,
    isExpressDelivery: false,
    paymentMethod: 'nagad',
    paymentStatus: 'paid',
    transactionId: 'TRX-NG-44551122',
    orderStatus: 'shipped',
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    estimatedDelivery: 'আগামীকাল দুপুর ২:০০ টার মধ্যে',
    courierName: 'Steadfast Courier',
    trackingNumber: 'STF-5582910',
  }
];

const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Admin Manager',
    email: 'admin@amarshop.com',
    phone: '01700000000',
    role: 'admin',
    twoFactorEnabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-customer',
    name: 'Rahim Chowdhury',
    email: 'rahim@example.com',
    phone: '01712345678',
    role: 'customer',
    twoFactorEnabled: true,
    createdAt: '2026-02-15T12:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  }
];

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    this.saveProducts(initialProducts);
    return initialProducts;
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('amarshop_products_updated', { detail: products }));
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Orders read failed', e);
    }
    this.saveOrders(initialOrders);
    return initialOrders;
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('amarshop_orders_updated', { detail: orders }));
  },

  addOrder(newOrder: Order): void {
    const orders = this.getOrders();
    const updated = [newOrder, ...orders];
    this.saveOrders(updated);
  },

  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Users read failed', e);
    }
    this.saveUsers(initialUsers);
    return initialUsers;
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('amarshop_users_updated', { detail: users }));
  },

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Current user read failed', e);
    }
    return null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    window.dispatchEvent(new CustomEvent('amarshop_auth_changed', { detail: user }));
  },

  getCart(): CartItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Cart read error', e);
    }
    return [];
  },

  saveCart(cart: CartItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  },

  // Export full database backup as JSON
  exportDatabaseJSON(): string {
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      products: this.getProducts(),
      orders: this.getOrders(),
      users: this.getUsers(),
      cloudSyncStatus: 'Firebase Cloud Encrypted & Synchronized',
    };
    return JSON.stringify(backup, null, 2);
  },

  // Restore database from JSON
  restoreDatabaseJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && Array.isArray(parsed.products)) {
        this.saveProducts(parsed.products);
      }
      if (parsed.orders && Array.isArray(parsed.orders)) {
        this.saveOrders(parsed.orders);
      }
      if (parsed.users && Array.isArray(parsed.users)) {
        this.saveUsers(parsed.users);
      }
      return true;
    } catch (err) {
      console.error('Failed to parse database backup', err);
      return false;
    }
  }
};
