import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

import {
  Language,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  User,
} from '../types';

import { translations } from '../translations';
import { StorageService } from '../services/storage';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  products: Product[];
  orders: Order[];
  users: User[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus
  ) => void;
  onRefreshData: () => void;
  firebaseStatus?: 'connecting' | 'connected' | 'offline' | 'error';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  language,
  products,
  orders,
  users,
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onRefreshData,
  firebaseStatus = 'connected',
}) => {
  /*
   * IMPORTANT:
   * All React Hooks must run before any conditional return.
   * This fixes the blank Admin Dashboard / hook order issue.
   */

  const t = translations[language];

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'customers' | 'backup'
  >('overview');

  // Product Add / Edit modal state
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [showProductForm, setShowProductForm] =
    useState(false);

  // Product form state
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescBn, setFormDescBn] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formCategory, setFormCategory] =
    useState<ProductCategory>('gadgets');
  const [formPrice, setFormPrice] = useState('2500');
  const [formStock, setFormStock] = useState('15');

  const [formImage, setFormImage] = useState(
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
  );

  const [formIsExpress, setFormIsExpress] =
    useState(true);

  // Backup notification
  const [backupNotice, setBackupNotice] = useState('');

  /*
   * Escape key handler
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (showProductForm) {
        setShowProductForm(false);
      } else {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [onClose, showProductForm]);

  /*
   * Analytics
   */
  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum +
      (order.paymentStatus === 'paid'
        ? order.total
        : 0),
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock <= 5
  ).length;

  /*
   * Open Add Product Form
   */
  const openAddForm = () => {
    setEditingProduct(null);

    setFormNameBn('');
    setFormNameEn('');
    setFormDescBn('');
    setFormDescEn('');

    setFormCategory('gadgets');
    setFormPrice('1950');
    setFormStock('20');

    setFormImage(
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'
    );

    setFormIsExpress(true);

    setShowProductForm(true);
  };

  /*
   * Open Edit Product Form
   */
  const openEditForm = (product: Product) => {
    setEditingProduct(product);

    setFormNameBn(product.nameBn);
    setFormNameEn(product.nameEn);
    setFormDescBn(product.descriptionBn);
    setFormDescEn(product.descriptionEn);

    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormImage(product.imageUrl);
    setFormIsExpress(product.isExpressDelivery);

    setShowProductForm(true);
  };

  /*
   * Save Product
   */
  const handleProductSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const product: Product = {
      id: editingProduct
        ? editingProduct.id
        : `prod-${Date.now()}`,

      nameBn: formNameBn.trim(),
      nameEn: formNameEn.trim(),

      descriptionBn: formDescBn.trim(),
      descriptionEn: formDescEn.trim(),

      category: formCategory,

      price: parseFloat(formPrice) || 100,

      stock: parseInt(formStock, 10) || 0,

      imageUrl: formImage.trim(),

      isExpressDelivery: formIsExpress,

      rating: editingProduct
        ? editingProduct.rating
        : 5.0,

      reviewsCount: editingProduct
        ? editingProduct.reviewsCount
        : 1,

      tags: [formCategory],

      reviews: editingProduct
        ? editingProduct.reviews
        : [],
    };

    onSaveProduct(product);

    setShowProductForm(false);
    setEditingProduct(null);
  };

  /*
   * Export Database
   */
  const handleExportDB = () => {
    try {
      const json =
        StorageService.exportDatabaseJSON();

      const blob = new Blob([json], {
        type: 'application/json',
      });

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement('a');

      a.href = url;

      a.download =
        `amarshop-database-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setBackupNotice(
        language === 'bn'
          ? 'ডাটাবেস সফলভাবে ডাউনলোড হয়েছে!'
          : 'Database exported successfully!'
      );

      setTimeout(() => {
        setBackupNotice('');
      }, 3000);
    } catch (error) {
      console.error(
        'Database export failed:',
        error
      );

      setBackupNotice(
        language === 'bn'
          ? 'ডাটাবেস ডাউনলোড করা যায়নি।'
          : 'Database export failed.'
      );
    }
  };

  /*
   * Import Database
   */
  const handleImportDB = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content =
          event.target?.result as string;

        const restored =
          StorageService.restoreDatabaseJSON(
            content
          );

        if (restored) {
          onRefreshData();

          setBackupNotice(
            language === 'bn'
              ? 'ডাটাবেস সফলভাবে রিস্টোর হয়েছে!'
              : 'Database restored successfully!'
          );
        } else {
          setBackupNotice(
            language === 'bn'
              ? 'ডাটাবেস রিস্টোর ব্যর্থ হয়েছে।'
              : 'Restore failed: Invalid JSON format.'
          );
        }
      } catch (error) {
        console.error(
          'Database restore failed:',
          error
        );

        setBackupNotice(
          language === 'bn'
            ? 'ডাটাবেস রিস্টোর করা যায়নি।'
            : 'Database restore failed.'
        );
      }

      setTimeout(() => {
        setBackupNotice('');
      }, 4000);
    };

    reader.readAsText(file);

    // Same file আবার select করার সুযোগ
    e.target.value = '';
  };

  /*
   * IMPORTANT:
   * Conditional return is AFTER all Hooks.
   */
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="admin-dashboard-modal"
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
      >
        {/* ================= HEADER ================= */}

        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                <Package className="w-5 h-5" />
              </span>

              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {t.adminTitle}
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.adminSubtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Firebase Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />

              <span>
                Firebase Real-Time Active
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />

              <span>
                {language === 'bn'
                  ? 'ড্যাশবোর্ড বন্ধ করুন'
                  : 'Close Dashboard'}
              </span>
            </button>
          </div>
        </div>

        {/* ================= TABS ================= */}

        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-semibold px-4">
          <button
            type="button"
            onClick={() =>
              setActiveTab('overview')
            }
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tab_overview}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('products')
            }
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tab_products} ({products.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('orders')
            }
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tab_orders} ({orders.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('customers')
            }
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tab_customers} ({users.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('backup')
            }
            className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tab_backup}
          </button>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= OVERVIEW ================= */}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                    <span className="text-xs font-semibold">
                      {t.totalRevenue}
                    </span>

                    <DollarSign className="w-5 h-5" />
                  </div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {t.bdt}
                    {totalRevenue.toLocaleString()}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Verified Gateway Payments
                  </p>
                </div>

                {/* Orders */}

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                    <span className="text-xs font-semibold">
                      {t.totalOrders}
                    </span>

                    <ShoppingBag className="w-5 h-5" />
                  </div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {orders.length}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Active customer parcels
                  </p>
                </div>

                {/* Customers */}

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
                    <span className="text-xs font-semibold">
                      {t.totalCustomers}
                    </span>

                    <Users className="w-5 h-5" />
                  </div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {users.length}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Registered customers
                  </p>
                </div>

                {/* Low Stock */}

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                    <span className="text-xs font-semibold">
                      {t.lowStockAlert}
                    </span>

                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {lowStockCount}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Units requiring restocking
                  </p>
                </div>
              </div>

              {/* Recent Orders */}

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.recentOrders}
                </h3>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <tr>
                        <th className="p-3">
                          Order ID
                        </th>

                        <th className="p-3">
                          Customer
                        </th>

                        <th className="p-3">
                          Total
                        </th>

                        <th className="p-3">
                          Payment
                        </th>

                        <th className="p-3">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders
                        .slice(0, 5)
                        .map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                          >
                            <td className="p-3 font-mono font-bold text-emerald-600">
                              {order.id}
                            </td>

                            <td className="p-3 font-semibold">
                              {order.customerName}
                            </td>

                            <td className="p-3 font-bold">
                              {t.bdt}
                              {order.total.toLocaleString()}
                            </td>

                            <td className="p-3 uppercase font-mono text-[11px]">
                              {order.paymentMethod}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {order.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= PRODUCTS ================= */}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {t.tab_products}
                </h3>

                <button
                  type="button"
                  onClick={openAddForm}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />

                  <span>
                    {t.addProduct}
                  </span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">
                        Product
                      </th>

                      <th className="p-3">
                        Category
                      </th>

                      <th className="p-3">
                        Price
                      </th>

                      <th className="p-3">
                        Stock
                      </th>

                      <th className="p-3">
                        Speed
                      </th>

                      <th className="p-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  product.imageUrl
                                }
                                alt={
                                  language ===
                                  'bn'
                                    ? product.nameBn
                                    : product.nameEn
                                }
                                className="w-10 h-10 rounded-lg object-cover"
                              />

                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {language ===
                                  'bn'
                                    ? product.nameBn
                                    : product.nameEn}
                                </p>

                                <p className="text-[11px] text-slate-400 line-clamp-1">
                                  {product.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 uppercase text-[11px] font-semibold text-slate-500">
                            {product.category}
                          </td>

                          <td className="p-3 font-bold text-emerald-600">
                            {t.bdt}
                            {product.price.toLocaleString()}
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                product.stock > 10
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                              }`}
                            >
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
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    product
                                  )
                                }
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteProduct(
                                    product.id
                                  )
                                }
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ORDERS ================= */}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">
                {t.tab_orders}
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">
                        Order ID
                      </th>

                      <th className="p-3">
                        Customer & Contact
                      </th>

                      <th className="p-3">
                        Items
                      </th>

                      <th className="p-3">
                        Total Amount
                      </th>

                      <th className="p-3">
                        Status
                      </th>

                      <th className="p-3">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {orders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3 font-mono font-bold text-emerald-600">
                            {order.id}

                            {order.isExpressDelivery && (
                              <span className="block text-[10px] text-amber-500 font-bold">
                                ⚡ Express
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {order.customerName}
                            </p>

                            <p className="text-[11px] text-slate-500">
                              {order.phone}
                            </p>

                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {order.address}
                            </p>
                          </td>

                          <td className="p-3">
                            <span className="font-medium">
                              {order.items.length}{' '}
                              items
                            </span>
                          </td>

                          <td className="p-3 font-bold text-emerald-600">
                            {t.bdt}
                            {order.total.toLocaleString()}
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                              {order.orderStatus}
                            </span>
                          </td>

                          <td className="p-3">
                            <select
                              value={
                                order.orderStatus
                              }
                              onChange={(e) =>
                                onUpdateOrderStatus(
                                  order.id,
                                  e.target
                                    .value as OrderStatus
                                )
                              }
                              className="text-[11px] p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
                            >
                              <option value="placed">
                                Placed
                              </option>

                              <option value="confirmed">
                                Confirmed
                              </option>

                              <option value="packed">
                                Packed
                              </option>

                              <option value="shipped">
                                Shipped
                              </option>

                              <option value="out_for_delivery">
                                Out for Delivery
                              </option>

                              <option value="delivered">
                                Delivered
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>
                            </select>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= CUSTOMERS ================= */}

          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold">
                {t.tab_customers}
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="p-3">
                        User
                      </th>

                      <th className="p-3">
                        Contact
                      </th>

                      <th className="p-3">
                        Role
                      </th>

                      <th className="p-3">
                        2FA Security
                      </th>

                      <th className="p-3">
                        Joined Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map(
                      (user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  user.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                                }
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />

                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {user.name}
                                </p>

                                <p className="text-[11px] text-slate-400 font-mono">
                                  {user.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <p>{user.email}</p>

                            <p className="text-slate-400">
                              {user.phone}
                            </p>
                          </td>

                          <td className="p-3 uppercase font-bold text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                user.role ===
                                'admin'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Active
                            </span>
                          </td>

                          <td className="p-3 text-slate-500">
                            {new Date(
                              user.createdAt
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= BACKUP ================= */}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Backup Notice */}

              {backupNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  ✓ {backupNotice}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export */}

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-600" />

                    <h4 className="text-sm font-bold">
                      {t.backupDatabase}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'সকল পণ্য, কাস্টমার অর্ডার ও ইউজার ডেটা JSON ব্যাকআপ ফাইল হিসেবে ডাউনলোড করুন।'
                      : 'Export your products, customer orders, and user data as a structured JSON backup.'}
                  </p>

                  <button
                    type="button"
                    onClick={handleExportDB}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />

                    <span>
                      {t.backupDatabase}
                    </span>
                  </button>
                </div>

                {/* Import */}

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600" />

                    <h4 className="text-sm font-bold">
                      {t.restoreDatabase}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'আগে নেওয়া JSON ব্যাকআপ ফাইল আপলোড করে ডেটা পুনরুদ্ধার করুন।'
                      : 'Restore your database from an existing AmarShop JSON backup.'}
                  </p>

                  <label className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md">
                    <Upload className="w-4 h-4" />

                    <span>
                      {t.restoreDatabase}
                    </span>

                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={
                        handleImportDB
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Firebase */}

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-600 animate-pulse" />

                    <div>
                      <h4 className="text-sm font-bold">
                        Google Firebase Firestore
                      </h4>

                      <p className="text-[11px] text-slate-500">
                        Project:
                        gen-lang-client-0769861458
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      firebaseStatus ===
                      'connected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {firebaseStatus ===
                    'connected'
                      ? '🔥 Live Cloud Connected'
                      : firebaseStatus ===
                        'connecting'
                      ? 'Connecting...'
                      : firebaseStatus ===
                        'offline'
                      ? 'Offline'
                      : 'Connection Error'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">
                      COLLECTION
                    </span>

                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      products ({products.length})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">
                      COLLECTION
                    </span>

                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      orders ({orders.length})
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">
                      PERSISTENCE
                    </span>

                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Real-time Snapshot
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'আপনার অ্যাপ্লিকেশনটি Google Firebase Firestore-এর সাথে সংযুক্ত। প্রোডাক্ট যোগ, অর্ডার প্লেসমেন্ট এবং অর্ডার স্ট্যাটাস আপডেট অ্যাপের ডেটা সার্ভিসের মাধ্যমে সংরক্ষণ করা হয়।'
                    : 'AmarShop is connected to Google Firebase Firestore. Product changes, customer orders, and status updates are handled through the application data service.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn'
              ? 'এডমিন ড্যাশবোর্ড থেকে বের হতে:'
              : 'To exit Admin Dashboard:'}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />

            <span>
              {language === 'bn'
                ? 'ড্যাশবোর্ড বন্ধ করুন (Close)'
                : 'Close Dashboard'}
            </span>
          </button>
        </div>
      </div>

      {/* ================= PRODUCT FORM MODAL ================= */}

      {showProductForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
          onClick={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setShowProductForm(false);
            }
          }}
        >
          <div
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 cursor-default"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}

            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold">
                {editingProduct
                  ? t.editProduct
                  : t.addProduct}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowProductForm(false)
                }
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-200 dark:border-rose-800/60"
              >
                <X className="w-4 h-4 stroke-[2.5]" />

                <span>
                  {language === 'bn'
                    ? 'বন্ধ করুন'
                    : 'Close'}
                </span>
              </button>
            </div>

            {/* Product Form */}

            <form
              onSubmit={
                handleProductSubmit
              }
              className="space-y-3 text-xs"
            >
              {/* Names */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {t.productNameBn} *
                  </label>

                  <input
                    type="text"
                    required
                    value={formNameBn}
                    onChange={(e) =>
                      setFormNameBn(
                        e.target.value
                      )
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {t.productNameEn} *
                  </label>

                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) =>
                      setFormNameEn(
                        e.target.value
                      )
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Descriptions */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn'
                      ? 'বাংলা বর্ণনা'
                      : 'Bangla Description'}
                  </label>

                  <textarea
                    value={formDescBn}
                    onChange={(e) =>
                      setFormDescBn(
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn'
                      ? 'ইংরেজি বর্ণনা'
                      : 'English Description'}
                  </label>

                  <textarea
                    value={formDescEn}
                    onChange={(e) =>
                      setFormDescEn(
                        e.target.value
                      )
                    }
                    rows={3}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Category / Price / Stock */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {t.category}
                  </label>

                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target
                          .value as ProductCategory
                      )
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="gadgets">
                      Gadgets
                    </option>

                    <option value="electronics">
                      Electronics
                    </option>

                    <option value="fashion">
                      Fashion
                    </option>

                    <option value="groceries">
                      Groceries
                    </option>

                    <option value="home">
                      Home
                    </option>

                    <option value="beauty">
                      Beauty
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {t.price} *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) =>
                      setFormPrice(
                        e.target.value
                      )
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    {t.stock} *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formStock}
                    onChange={(e) =>
                      setFormStock(
                        e.target.value
                      )
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Image URL */}

              <div>
                <label className="block font-semibold mb-1">
                  {t.imageUrl}
                </label>

                <input
                  type="url"
                  required
                  value={formImage}
                  onChange={(e) =>
                    setFormImage(
                      e.target.value
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Express Delivery */}

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold">
                  {t.expressBadge} (12-24h)
                </span>

                <input
                  type="checkbox"
                  checked={formIsExpress}
                  onChange={(e) =>
                    setFormIsExpress(
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowProductForm(false)
                  }
                  className="py-2 px-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
