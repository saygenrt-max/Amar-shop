export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

export type ProductCategory = 
  | 'all'
  | 'electronics'
  | 'fashion'
  | 'groceries'
  | 'home'
  | 'beauty'
  | 'gadgets';

export interface ProductReview {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  date: string;
  commentBn: string;
  commentEn: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  isExpressDelivery: boolean; // Fast delivery in 12-24h
  featured?: boolean;
  tags: string[];
  reviews: ProductReview[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'card' | 'cod';

export type OrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productNameBn: string;
  productNameEn: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  isExpressDelivery: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid';
  transactionId?: string;
  orderStatus: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  courierName: string;
  trackingNumber: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: string;
  addresses?: string[];
  avatar?: string;
  password?: string;
}

export interface EmailVerification {
  id: string;
  email: string;
  code: string; // 4-digit code (e.g. "4812")
  purpose: 'register' | 'forgot_password';
  expiresAt: number;
  createdAt: string;
  verified: boolean;
  tempUserData?: {
    name: string;
    phone: string;
    password?: string;
    enable2FA?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface StoreFilter {
  category: ProductCategory;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  ratingFilter: number;
  onlyExpress: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}
