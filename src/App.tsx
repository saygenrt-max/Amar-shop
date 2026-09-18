import React, { useState, useEffect, useMemo } from 'react';
import { 
  Language, 
  Theme, 
  Product, 
  CartItem, 
  Order, 
  User, 
  StoreFilter, 
  ProductCategory,
  OrderStatus,
  ProductReview
} from './types';
import { translations } from './translations';
import { StorageService, initialOrders } from './services/storage';
import { FirebaseService, subscribeSyncStatus } from './services/firebase';

// Components
import { Navbar } from './components/Navbar';
import { FilterSidebar } from './components/FilterSidebar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AIChatbot } from './components/AIChatbot';
import { SourceCodeModal } from './components/SourceCodeModal';

import { 
  Zap, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  Download, 
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  PhoneCall,
  Mail,
  Heart
} from 'lucide-react';

export default function App() {
  // 1. Language & Theme
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('amarshop_lang') as Language) || 'bn';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('amarshop_theme') as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('amarshop_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('amarshop_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = (lang: Language) => setLanguage(lang);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const t = translations[language];

  // 2. Core Store State
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => StorageService.getOrders());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [cart, setCart] = useState<CartItem[]>(() => StorageService.getCart());
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'offline' | 'error'>('connecting');

  // Firebase Real-time Firestore Cloud Database Synchronization
  useEffect(() => {
    const unsubStatus = subscribeSyncStatus((status) => {
      setFirebaseStatus(status);
    });

    const unsubProducts = FirebaseService.subscribeProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        StorageService.saveProducts(cloudProducts);
      }
    });

    const unsubOrders = FirebaseService.subscribeOrders(initialOrders, (cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
        StorageService.saveOrders(cloudOrders);
      }
    });

    return () => {
      unsubStatus();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // Cart helper & storage sync
  useEffect(() => {
    StorageService.saveCart(cart);
  }, [cart]);

  // Listen to cross-window or internal storage events
  useEffect(() => {
    const handleProductsUpdated = (e: any) => setProducts(e.detail);
    const handleOrdersUpdated = (e: any) => setOrders(e.detail);
    const handleUsersUpdated = (e: any) => setUsers(e.detail);
    const handleAuthChanged = (e: any) => setCurrentUser(e.detail);

    window.addEventListener('amarshop_products_updated', handleProductsUpdated);
    window.addEventListener('amarshop_orders_updated', handleOrdersUpdated);
    window.addEventListener('amarshop_users_updated', handleUsersUpdated);
    window.addEventListener('amarshop_auth_changed', handleAuthChanged);

    return () => {
      window.removeEventListener('amarshop_products_updated', handleProductsUpdated);
      window.removeEventListener('amarshop_orders_updated', handleOrdersUpdated);
      window.removeEventListener('amarshop_users_updated', handleUsersUpdated);
      window.removeEventListener('amarshop_auth_changed', handleAuthChanged);
    };
  }, []);

  // 3. Filter State
  const [filter, setFilter] = useState<StoreFilter>({
    category: 'all',
    searchQuery: '',
    minPrice: 0,
    maxPrice: 10000,
    ratingFilter: 0,
    onlyExpress: false,
    sortBy: 'featured',
  });

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isExpressCart, setIsExpressCart] = useState<boolean>(false);

  // 4. Modal Views
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingInitialId, setTrackingInitialId] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSourceCodeOpen, setIsSourceCodeOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`${language === 'bn' ? product.nameBn : product.nameEn} ${t.addedToCart}`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleApplyCoupon = (code: string): boolean => {
    if (code.toUpperCase() === 'AMAR10' || code.toUpperCase() === 'SPECIAL') {
      setAppliedDiscount(0.10); // 10% discount
      return true;
    }
    return false;
  };

  // Product Reviews Submission
  const handleAddReview = async (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => {
    let updatedProductToSync: Product | null = null;
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const newRev: ProductReview = {
          ...review,
          id: `rev-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
        };
        const allRevs = [newRev, ...(p.reviews || [])];
        const avg = allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length;
        const target: Product = {
          ...p,
          reviews: allRevs,
          rating: Number(avg.toFixed(1)),
          reviewsCount: allRevs.length,
        };
        updatedProductToSync = target;
        return target;
      }
      return p;
    });

    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts);
    if (updatedProductToSync) {
      try {
        await FirebaseService.saveProduct(updatedProductToSync);
      } catch (err) {
        console.warn('Firebase review sync error:', err);
      }
    }
    showToast(language === 'bn' ? 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে!' : 'Review submitted successfully!');
  };

  // Order Placement Success
  const handleOrderSuccess = async (newOrder: Order) => {
    StorageService.addOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedDiscount(0);
    try {
      await FirebaseService.saveOrder(newOrder);
    } catch (err) {
      console.warn('Firebase save order error:', err);
    }
    showToast(language === 'bn' ? 'অর্ডার সফল হয়েছে এবং ক্লাউড ডাটাবেজে সংরক্ষিত হয়েছে!' : 'Order confirmed & saved to cloud DB!');
  };

  // Admin Actions
  const handleSaveProduct = async (product: Product) => {
    const existingIndex = products.findIndex(p => p.id === product.id);
    let updated: Product[];
    if (existingIndex >= 0) {
      updated = [...products];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...products];
    }
    setProducts(updated);
    StorageService.saveProducts(updated);
    try {
      await FirebaseService.saveProduct(product);
    } catch (err) {
      console.warn('Firebase product save error:', err);
    }
    showToast(language === 'bn' ? 'পণ্য ক্লাউড ডাটাবেজে সংরক্ষিত হয়েছে!' : 'Product saved to cloud database!');
  };

  const handleDeleteProduct = async (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    StorageService.saveProducts(updated);
    try {
      await FirebaseService.deleteProduct(productId);
    } catch (err) {
      console.warn('Firebase product delete error:', err);
    }
    showToast(language === 'bn' ? 'পণ্য মুছে ফেলা হয়েছে' : 'Product removed');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o);
    setOrders(updated);
    StorageService.saveOrders(updated);
    try {
      await FirebaseService.updateOrderStatus(orderId, status);
    } catch (err) {
      console.warn('Firebase order status update error:', err);
    }
    showToast(language === 'bn' ? 'অর্ডার স্ট্যাটাস ক্লাউডে আপডেট হয়েছে' : 'Order status updated in cloud');
  };

  // Auth Operations
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    showToast(`${language === 'bn' ? 'স্বাগতম' : 'Welcome'}, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.setCurrentUser(null);
    showToast(language === 'bn' ? 'সফলভাবে লগআউট হয়েছেন' : 'Logged out successfully');
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Category
        if (filter.category !== 'all' && product.category !== filter.category) {
          return false;
        }
        // Search
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const matchBn = product.nameBn.toLowerCase().includes(q) || product.descriptionBn.toLowerCase().includes(q);
          const matchEn = product.nameEn.toLowerCase().includes(q) || product.descriptionEn.toLowerCase().includes(q);
          const matchTag = product.tags.some(t => t.toLowerCase().includes(q));
          if (!matchBn && !matchEn && !matchTag) return false;
        }
        // Price
        if (product.price > filter.maxPrice) {
          return false;
        }
        // Rating
        if (filter.ratingFilter > 0 && product.rating < filter.ratingFilter) {
          return false;
        }
        // Express only
        if (filter.onlyExpress && !product.isExpressDelivery) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'price-asc') return a.price - b.price;
        if (filter.sortBy === 'price-desc') return b.price - a.price;
        if (filter.sortBy === 'rating') return b.rating - a.rating;
        if (filter.sortBy === 'newest') return (b.originalPrice || b.price) - (a.originalPrice || a.price);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, filter]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 p-3.5 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        language={language}
        onToggleLanguage={toggleLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenSourceCode={() => setIsSourceCodeOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        currentUser={currentUser}
        searchQuery={filter.searchQuery}
        onSearchChange={(q) => setFilter(prev => ({ ...prev, searchQuery: q }))}
        onToggleMobileFilters={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        firebaseStatus={firebaseStatus}
      />

      {/* Hero Category Highlights Strip */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            {(['all', 'gadgets', 'electronics', 'fashion', 'groceries', 'home', 'beauty'] as ProductCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(prev => ({ ...prev, category: cat }))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filter.category === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'all' && t.cat_all}
                {cat === 'gadgets' && t.cat_gadgets}
                {cat === 'electronics' && t.cat_electronics}
                {cat === 'fashion' && t.cat_fashion}
                {cat === 'groceries' && t.cat_groceries}
                {cat === 'home' && t.cat_home}
                {cat === 'beauty' && t.cat_beauty}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs font-semibold shrink-0 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-3.5 h-3.5 fill-current" />
              12-24h Express
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              2FA Protected
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Sub-header Bar: Result count & Sort dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {filter.category === 'all' ? t.cat_all : (
                filter.category === 'gadgets' ? t.cat_gadgets :
                filter.category === 'electronics' ? t.cat_electronics :
                filter.category === 'fashion' ? t.cat_fashion :
                filter.category === 'groceries' ? t.cat_groceries :
                filter.category === 'home' ? t.cat_home : t.cat_beauty
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredProducts.length} {t.productsFound}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold hidden sm:inline">{t.sortBy}:</span>
            <div className="relative">
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-emerald-500 cursor-pointer shadow-xs appearance-none"
              >
                <option value="featured">{t.sort_featured}</option>
                <option value="price-asc">{t.sort_price_asc}</option>
                <option value="price-desc">{t.sort_price_desc}</option>
                <option value="rating">{t.sort_rating}</option>
                <option value="newest">{t.sort_newest}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Content Layout: Left Sidebar + Right Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <FilterSidebar
              filter={filter}
              onChangeFilter={(up) => setFilter(prev => ({ ...prev, ...up }))}
              onResetFilter={() => setFilter({
                category: 'all',
                searchQuery: '',
                minPrice: 0,
                maxPrice: 10000,
                ratingFilter: 0,
                onlyExpress: false,
                sortBy: 'featured',
              })}
              language={language}
              totalProductsCount={products.length}
            />
          </div>

          {/* Mobile Filter Overlay Modal */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div 
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
              />
              <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-slate-900 h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
                <FilterSidebar
                  filter={filter}
                  onChangeFilter={(up) => setFilter(prev => ({ ...prev, ...up }))}
                  onResetFilter={() => setFilter({
                    category: 'all',
                    searchQuery: '',
                    minPrice: 0,
                    maxPrice: 10000,
                    ratingFilter: 0,
                    onlyExpress: false,
                    sortBy: 'featured',
                  })}
                  language={language}
                  totalProductsCount={products.length}
                />
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  {language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply Filters'}
                </button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t.noProductsFound}</h3>
                <button
                  onClick={() => setFilter({
                    category: 'all',
                    searchQuery: '',
                    minPrice: 0,
                    maxPrice: 10000,
                    ratingFilter: 0,
                    onlyExpress: false,
                    sortBy: 'featured',
                  })}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  {t.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    onAddToCart={(p) => handleAddToCart(p, 1)}
                    onViewDetails={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Floating Customer Support AI Chatbot */}
      <AIChatbot language={language} />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        language={language}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onAddReview={handleAddReview}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        language={language}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        isExpressDelivery={isExpressCart}
        onToggleExpressDelivery={setIsExpressCart}
        appliedDiscount={appliedDiscount}
        onApplyCoupon={handleApplyCoupon}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        language={language}
        currentUser={currentUser}
        isExpressDelivery={isExpressCart}
        appliedDiscount={appliedDiscount}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracking={(orderId) => {
          setTrackingInitialId(orderId);
          setIsTrackingOpen(true);
        }}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        orders={orders}
        language={language}
        initialOrderId={trackingInitialId}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        language={language}
        products={products}
        orders={orders}
        users={users}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onRefreshData={() => {
          setProducts(StorageService.getProducts());
          setOrders(StorageService.getOrders());
          setUsers(StorageService.getUsers());
        }}
        firebaseStatus={firebaseStatus}
      />

      <SourceCodeModal
        isOpen={isSourceCodeOpen}
        onClose={() => setIsSourceCodeOpen(false)}
        language={language}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center">
                  <span>অ</span>
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {t.brandName}
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                {language === 'bn' 
                  ? 'বাংলাদেশের সবচেয়ে বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম। জেনুইন প্রোডাক্ট, দ্রুততম ১২-২৪ ঘণ্টার এক্সপ্রেস ডেলিভারি এবং সুরক্ষিত পেমেন্ট গ্যারান্টি।' 
                  : 'Fast, secure and verified e-commerce shopping platform with nationwide 12-24h delivery and 2FA protection.'}
              </p>
              <div className="flex items-center gap-2 pt-1 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {language === 'bn' ? 'দ্রুত লিঙ্ক' : 'Quick Navigation'}
              </h4>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => setIsTrackingOpen(true)} className="hover:text-emerald-600 cursor-pointer">
                    {t.trackOrder}
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsCartOpen(true)} className="hover:text-emerald-600 cursor-pointer">
                    {t.shoppingCart}
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsAdminOpen(true)} className="hover:text-emerald-600 cursor-pointer">
                    {t.adminPanel}
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsSourceCodeOpen(true)} className="hover:text-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer">
                    {t.sourceCode} (.zip)
                  </button>
                </li>
              </ul>
            </div>

            {/* Payment Gateways */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {language === 'bn' ? 'অনুমোদিত পেমেন্ট মাধ্যম' : 'Payment Gateways'}
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-md bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-bold border border-pink-200 dark:border-pink-800">
                  bKash বিকাশ
                </span>
                <span className="px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800">
                  Nagad নগদ
                </span>
                <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                  Rocket রকেট
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  Visa / Master
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Cash on Delivery
                </span>
              </div>
            </div>

            {/* Support & Contact */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {language === 'bn' ? 'কাস্টমার হেল্পলাইন' : 'Customer Support'}
              </h4>
              <div className="space-y-1.5 text-slate-500">
                <p className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+880 9612-000000 (9 AM - 10 PM)</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>support@amarshop.com</span>
                </p>
                <p className="text-[11px] pt-1 text-slate-400">
                  Dhaka, Bangladesh
                </p>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} AmarShop Platform. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <button onClick={() => setIsSourceCodeOpen(true)} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Download Source Code (PHP + React)
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
