import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Zap, 
  Tag, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { CartItem, Language } from '../types';
import { translations } from '../translations';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  language: Language;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  isExpressDelivery: boolean;
  onToggleExpressDelivery: (enable: boolean) => void;
  appliedDiscount: number;
  onApplyCoupon: (code: string) => boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  language,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  isExpressDelivery,
  onToggleExpressDelivery,
  appliedDiscount,
  onApplyCoupon,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(appliedDiscount > 0);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 3000 ? 0 : isExpressDelivery ? 110 : 60;
  const discountAmount = Math.round(subtotal * appliedDiscount);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (onApplyCoupon(couponInput.trim())) {
      setCouponSuccess(true);
      setCouponError(false);
    } else {
      setCouponError(true);
      setCouponSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.shoppingCart} ({cart.reduce((c, i) => c + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-16 h-16 stroke-1 mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t.emptyCart}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  {t.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const name = language === 'bn' ? item.product.nameBn : item.product.nameEn;
                return (
                  <div key={item.product.id} className="py-3.5 flex gap-3.5 items-center">
                    <img
                      src={item.product.imageUrl}
                      alt={name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {name}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {t.bdt}{item.product.price.toLocaleString()}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-auto cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer calculation & checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-3.5">
              
              {/* Express Delivery Option Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t.expressDeliveryOption}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isExpressDelivery}
                  onChange={(e) => onToggleExpressDelivery(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
              </div>

              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t.couponPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white cursor-pointer"
                >
                  {t.applyCoupon}
                </button>
              </form>
              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {t.couponApplied}
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-500 font-medium">
                  ✕ {t.invalidCoupon}
                </p>
              )}

              {/* Summary table */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.subtotal}</span>
                  <span>{t.bdt}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t.shipping}</span>
                  <span>{shippingFee === 0 ? t.freeShipping : `${t.bdt}${shippingFee}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>{t.discount} (10%)</span>
                    <span>-{t.bdt}{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>{t.total}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t.bdt}{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button & Close Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-3.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98"
                >
                  <span>{t.proceedToCheckout}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted & Fast Verified Delivery</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
