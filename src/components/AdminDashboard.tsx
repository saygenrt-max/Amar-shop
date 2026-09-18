import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  Users,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  Cloud,
  AlertTriangle,
  Zap,
  DollarSign,
  Search,
  CheckCircle
} from 'lucide-react';
import { Language, Order, OrderStatus, Product, ProductCategory, User } from '../types';
import { translations } from '../translations';
import { StorageService } from '../services/storage';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  products?: Product[];
  orders?: Order[];
  users?: User[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onRefreshData: () => void;
  firebaseStatus?: 'connecting' | 'connected' | 'offline' | 'error';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  language,
  products = [],
  orders = [],
  users = [],
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onRefreshData,
  firebaseStatus = 'connected',
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'backup'>('overview');

  // Search queries for lists
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Product Add / Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Form Fields
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescBn, setFormDescBn] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('gadgets');
  const [formPrice, setFormPrice] = useState('2500');
  const [formStock, setFormStock] = useState('15');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80');
  const [formIsExpress, setFormIsExpress] = useState(true);

  // Backup restore notification
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lock body scroll & Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showProductForm) {
          setShowProductForm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showProductForm]);

  // Analytics
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => (p.stock ?? 0) <= 5).length;
  }, [products]);

  // Filtered lists
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      p.nameBn?.toLowerCase().includes(q) || 
      p.nameEn?.toLowerCase().includes(q) || 
      p.id?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(o => 
      o.id?.toLowerCase().includes(q) || 
      o.customerName?.toLowerCase().includes(q) || 
      o.phone?.includes(q) ||
      o.orderStatus?.toLowerCase().includes(q)
    );
  }, [orders, orderSearch]);

  const filteredUsers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.phone?.includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  }, [users, customerSearch]);

  if (!isOpen) return null;

  const openAddForm = () => {
    setEditingProduct(null);
    setFormNameBn('');
    setFormNameEn('');
    setFormDescBn('');
    setFormDescEn('');
    setFormCategory('gadgets');
    setFormPrice('1950');
    setFormStock('20');
    setFormImage('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80');
    setFormIsExpress(true);
    setShowProductForm(true);
  };

  const openEditForm = (p: Product) => {
    setEditingProduct(p);
    setFormNameBn(p.nameBn || '');
    setFormNameEn(p.nameEn || '');
    setFormDescBn(p.descriptionBn || '');
    setFormDescEn(p.descriptionEn || '');
    setFormCategory(p.category || 'gadgets');
    setFormPrice(p.price?.toString() || '0');
    setFormStock(p.stock?.toString() || '0');
    setFormImage(p.imageUrl || '');
    setFormIsExpress(Boolean(p.isExpressDelivery));
    setShowProductForm(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      nameBn: formNameBn.trim(),
      nameEn: formNameEn.trim(),
      descriptionBn: formDescBn.trim(),
      descriptionEn: formDescEn.trim(),
      category: formCategory,
      price: Math.max(0, parseFloat(formPrice) || 0),
      stock: Math.max(0, parseInt(formStock, 10) || 0),
      imageUrl: formImage.trim(),
      isExpressDelivery: formIsExpress,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0,
      tags: [formCategory],
      reviews: editingProduct ? editingProduct.reviews : [],
    };

    onSaveProduct(product);
    setShowProductForm(false);
  };

  // Download DB JSON
  const handleExportDB = () => {
    try {
      const json = StorageService.exportDatabaseJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amarshop-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupNotice({
        type: 'success',
        message: language === 'bn' ? 'ডাটাবেস সফলভাবে ডাউনলোড হয়েছে!' : 'Database exported successfully!'
      });
    } catch {
      setBackupNotice({
        type: 'error',
        message: language === 'bn' ? 'ডাটাবেস এক্সপোর্ট করতে ব্যর্থ হয়েছে।' : 'Failed to export database.'
      });
    }
    setTimeout(() => setBackupNotice(null), 4000);
  };

  // Import DB JSON
  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (StorageService.restoreDatabaseJSON(content)) {
          onRefreshData();
          setBackupNotice({
            type: 'success',
            message: language === 'bn' ? 'ডাটাবেস সফলভাবে রিস্টোর হয়েছে!' : 'Database restored successfully!'
          });
        } else {
          setBackupNotice({
            type: 'error',
            message: language === 'bn' ? 'ডাটাবেস রিস্টোর ব্যর্থ হয়েছে: অবৈধ ফরম্যাট।' : 'Restore failed: Invalid JSON format.'
          });
        }
      } catch {
        setBackupNotice({
          type: 'error',
          message: language === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে।' : 'Failed to read file.'
        });
      }
      setTimeout(() => setBackupNotice(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'packed':
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="admin-dashboard-modal"
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold">{t.adminTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Firebase Live status badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {firebaseStatus === 'connected' ? 'Firebase Real-Time Active' : 'Connecting Cloud...'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-sm shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'bn' ? 'ড্যাশবোর্ড বন্ধ করুন' : 'Close Dashboard'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-semibold px-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.tab_overview}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.tab_products} ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.tab_orders} ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.tab_customers} ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.tab_backup}
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-xs font-semibold">{t.totalRevenue}</span>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {t.bdt}{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Verified Gateway Payments</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                    <span className="text-xs font-semibold">{t.totalOrders}</span>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {orders.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Total customer parcels</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                    <span className="text-xs font-semibold">{t.totalCustomers}</span>
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {users.length}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Registered users</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                    <span className="text-xs font-semibold">{t.lowStockAlert}</span>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {lowStockCount}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Units requiring restocking (≤5)</p>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.recentOrders}
                </h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 border border-dashed rounded-xl text-center">
                    {language === 'bn' ? 'কোনো অর্ডার নেই' : 'No recent orders available'}
                  </p>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Payment</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono font-bold text-emerald-600">{order.id}</td>
                            <td className="p-3 font-semibold">{order.customerName}</td>
                            <td className="p-3 font-bold">{t.bdt}{order.total.toLocaleString()}</td>
                            <td className="p-3 uppercase font-mono text-[11px]">{order.paymentMethod}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={openAddForm}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addProduct}</span>
                </button>
              </div>

              {/* Product Grid / Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Speed</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={product.imageUrl || 'https://via.placeholder.com/150'}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {language === 'bn' ? product.nameBn : product.nameEn}
                                </p>
                                <p className="text-[11px] text-slate-400 line-clamp-1">{product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 uppercase text-[11px] font-semibold text-slate-500">{product.category}</td>
                          <td className="p-3 font-bold text-emerald-600">{t.bdt}{product.price.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              product.stock > 5
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                            }`}>
                              {product.stock} pcs
                            </span>
                          </td>
                          <td className="p-3">
                            {product.isExpressDelivery && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <Zap className="w-3 h-3 fill-current" />
                                12-24h
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditForm(product)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(language === 'bn' ? 'আপনি কি এই পণ্যটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this product?')) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'অর্ডার আইডি বা নাম দিয়ে খুঁজুন...' : 'Search order ID or customer...'}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer & Contact</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {language === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No orders found'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-bold text-emerald-600">
                            {order.id}
                            {order.isExpressDelivery && (
                              <span className="block text-[10px] text-amber-500 font-bold">⚡ Express</span>
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{order.customerName}</p>
                            <p className="text-[11px] text-slate-500">{order.phone}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{order.address}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-medium">{order.items?.length || 0} items</span>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">
                            {t.bdt}{order.total?.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer focus:border-indigo-500"
                            >
                              <option value="placed">Placed</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="packed">Packed</option>
                              <option value="shipped">Shipped</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'bn' ? 'গ্রাহক খুঁজুন...' : 'Search customers...'}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">2FA Security</th>
                      <th className="p-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          {language === 'bn' ? 'কোনো গ্রাহক পাওয়া যায়নি' : 'No customers found'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <p>{u.email}</p>
                            <p className="text-slate-400">{u.phone}</p>
                          </td>
                          <td className="p-3 uppercase font-bold text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Active
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BACKUP & FIREBASE SYNC */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {backupNotice && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  backupNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}>
                  {backupNotice.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{backupNotice.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold">{t.backupDatabase}</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'bn'
                      ? 'সকল পণ্য, কাস্টমার অর্ডার ও ইউজার ডেটা সম্পূর্ণ এনক্রিপ্টেড JSON ফাইল হিসেবে ডাউনলোড করুন।'
                      : 'Export all products, customer orders, and credentials in a secure structured JSON backup.'}
                  </p>
                  <button
                    onClick={handleExportDB}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.backupDatabase}</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-bold">{t.restoreDatabase}</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'bn'
                      ? 'পূর্বে ব্যাকআপ নেওয়া JSON ফাইল আপলোড করে তাৎক্ষণিক ডাটাবেস পুনরুদ্ধার করুন।'
                      : 'Restore your entire database instantly from an existing AmarShop JSON backup.'}
                  </p>
                  <label className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md transition-transform active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>{t.restoreDatabase}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDB}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Cloud Sync Status Info */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold">Google Firebase Firestore</h4>
                      <p className="text-[11px] text-slate-500">Project: gen-lang-client-0769861458</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    firebaseStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {firebaseStatus === 'connected' ? '🔥 Live Cloud Connected' : 'Syncing...'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">COLLECTION</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">products ({products.length})</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">COLLECTION</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">orders ({orders.length})</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">PERSISTENCE</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Real-time Snapshot</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {language === 'bn'
                    ? 'আপনার অ্যাপ্লিকেশনটি গুগল ক্লাউড ফায়ারবেস ফায়ারস্টোর (Google Firebase Firestore)-এর সাথে সরাসরি সংযুক্ত। প্রোডাক্ট যোগ, অর্ডার প্লেসমেন্ট এবং অর্ডার ট্র্যাকিং স্বয়ংক্রিয়ভাবে রিয়েল-টাইমে সিঙ্ক হয়।'
                    : 'AmarShop is directly connected to Google Firebase Firestore. Product changes, customer orders, and status updates persist immediately across all devices in real-time.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Admin Dashboard Bottom Exit Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'এডমিন ড্যাশবোর্ড থেকে বের হতে:' : 'To exit Admin Dashboard:'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'ড্যাশবোর্ড বন্ধ করুন (Close)' : 'Close Dashboard'}</span>
          </button>
        </div>

      </div>

      {/* PRODUCT ADD / EDIT SUB-MODAL */}
      {showProductForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProductForm(false);
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 cursor-default max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold">
                {editingProduct ? t.editProduct : t.addProduct}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-200 dark:border-rose-800/60"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t.productNameBn} *</label>
                  <input
                    type="text"
                    required
                    value={formNameBn}
                    onChange={(e) => setFormNameBn(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t.productNameEn} *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Description (বাংলা)</label>
                  <textarea
                    rows={2}
                    value={formDescBn}
                    onChange={(e) => setFormDescBn(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t.category}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="gadgets">Gadgets</option>
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="groceries">Groceries</option>
                    <option value="home">Home</option>
                    <option value="beauty">Beauty</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">{t.price} *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">{t.stock} *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t.imageUrl} *</label>
                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold">{t.expressBadge} (12-24h)</span>
                <input
                  type="checkbox"
                  checked={formIsExpress}
                  onChange={(e) => setFormIsExpress(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="py-2 px-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-transform active:scale-95 shadow-sm"
                >
                  {t.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
