import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Zap, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CartItem, Language, Order, PaymentMethod, User } from '../types';
import { translations } from '../translations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  language: Language;
  currentUser: User | null;
  isExpressDelivery: boolean;
  appliedDiscount: number;
  onOrderSuccess: (order: Order) => void;
  onOpenTracking: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  language,
  currentUser,
  isExpressDelivery: initialExpress,
  appliedDiscount,
  onOrderSuccess,
  onOpenTracking,
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

  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [fullName, setFullName] = useState(currentUser?.name || 'Ariful Islam');
  const [phone, setPhone] = useState(currentUser?.phone || '01712345678');
  const [email, setEmail] = useState(currentUser?.email || 'ariful@example.com');
  const [address, setAddress] = useState('House 22, Road 4, Sector 7, Uttara');
  const [city, setCity] = useState('Dhaka');
  const [notes, setNotes] = useState('');
  const [isExpressDelivery, setIsExpressDelivery] = useState(initialExpress);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [paymentInput, setPaymentInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 3000 ? 0 : isExpressDelivery ? 110 : 60;
  const discountAmount = Math.round(subtotal * appliedDiscount);
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !address) return;
    setStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const trxPrefix = paymentMethod === 'bkash' ? 'BK' : paymentMethod === 'nagad' ? 'NG' : paymentMethod === 'rocket' ? 'RK' : 'TX';
      const transactionId = paymentMethod === 'cod' ? undefined : `TRX-${trxPrefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const newOrder: Order = {
        id: orderId,
        userId: currentUser?.id,
        customerName: fullName,
        phone,
        email,
        address,
        city,
        notes,
        items: cart.map(item => ({
          productId: item.product.id,
          productNameBn: item.product.nameBn,
          productNameEn: item.product.nameEn,
          price: item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl,
        })),
        subtotal,
        shippingFee,
        discount: discountAmount,
        total: grandTotal,
        isExpressDelivery,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        transactionId,
        orderStatus: 'placed',
        createdAt: new Date().toISOString(),
        estimatedDelivery: isExpressDelivery 
          ? (language === 'bn' ? 'আগামীকাল সকাল ১১:০০ টার মধ্যে' : 'Tomorrow by 11:00 AM') 
          : (language === 'bn' ? '২-৩ কার্যদিবসের মধ্যে' : 'Within 2-3 Business Days'),
        courierName: isExpressDelivery ? 'Pathao Express 24H' : 'Steadfast Courier Ltd',
        trackingNumber: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      setCreatedOrder(newOrder);
      onOrderSuccess(newOrder);
      setIsProcessing(false);
      setStep('success');
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="checkout-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold">{t.checkoutTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <div className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 ${
            step === 'shipping' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span>{t.shippingInfo}</span>
          </div>
          <div className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 ${
            step === 'payment' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span>{t.paymentMethod}</span>
          </div>
          <div className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 ${
            step === 'success' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' : 'text-slate-400'
          }`}>
            <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span>{t.orderSuccess.split(' ')[0]}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* STEP 1: SHIPPING */}
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {t.city} *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {t.fullAddress} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Fast Delivery Option in Checkout */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t.expressBadge}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'bn' ? 'সুপারফাস্ট ১২-২৪ ঘণ্টার মধ্যে অগ্রাধিকারমূলক ডেলিভারি' : 'Priority delivery within 12-24 hours guaranteed'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isExpressDelivery}
                  onChange={(e) => setIsExpressDelivery(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Subtotal preview */}
              <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{t.total}:</span>
                <span className="text-emerald-600 text-base">{t.bdt}{grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {language === 'bn' ? 'বাতিল করুন (Close)' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <span>{language === 'bn' ? 'পেমেন্ট ধাপে এগিয়ে যান' : 'Continue to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t.paymentMethod}:
              </p>

              {/* Payment Gateway Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'bkash' 
                      ? 'border-pink-500 bg-pink-50/60 dark:bg-pink-950/40 ring-2 ring-pink-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-pink-600">bKash বিকাশ</span>
                  <span className="text-[10px] text-slate-500 mt-1">Instant Wallet</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'nagad' 
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 ring-2 ring-orange-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-orange-600">Nagad নগদ</span>
                  <span className="text-[10px] text-slate-500 mt-1">Post Office Digital</span>
                </button>

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('rocket')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'rocket' 
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-purple-600">Rocket রকেট</span>
                  <span className="text-[10px] text-slate-500 mt-1">DBBL Mobile</span>
                </button>

                {/* Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'card' 
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-blue-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Card
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Visa / Master</span>
                </button>

                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'cod' 
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-extrabold text-sm text-emerald-600 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    {t.payCod.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">{t.payCod}</span>
                </button>
              </div>

              {/* Dynamic Gateway Inputs Simulation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {paymentMethod !== 'cod' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        {paymentMethod === 'card' ? 'Card Number (১২৩৪ ৫৬৭৮ ৯৮৭৬ ৫৪৩২)' : `${paymentMethod.toUpperCase()} Account Number`}
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentInput}
                        onChange={(e) => setPaymentInput(e.target.value)}
                        placeholder={paymentMethod === 'card' ? '4111 2222 3333 4444' : '017XXXXXXXX'}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                        {paymentMethod === 'card' ? 'CVC / PIN' : t.enterPin}
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="••••"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {language === 'bn' 
                      ? 'পণ্য হাতে পেয়ে চেক করে ডেলিভারিম্যানকে ক্যাশ পেমেন্ট পরিশোধ করবেন।' 
                      : 'Pay with cash upon delivery once you inspect your package.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ← {language === 'bn' ? 'ঠিকানা পরিবর্তন' : 'Back to Address'}
                </button>
                <div className="text-right">
                  <p className="text-slate-500 font-normal">{t.total}:</p>
                  <p className="text-emerald-600 text-lg font-extrabold">{t.bdt}{grandTotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="py-3.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                >
                  {language === 'bn' ? 'বন্ধ করুন (Close)' : 'Close'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {language === 'bn' ? 'পেমেন্ট ভেরিফাই করা হচ্ছে...' : 'Verifying Payment...'}
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t.confirmAndPay} ({t.bdt}{grandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && createdOrder && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.orderSuccess}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'bn' 
                    ? 'আপনার অর্ডারের কনফার্মেশন এসএমএস ও ইমেইলে পাঠিয়ে দেওয়া হয়েছে।' 
                    : 'A confirmation SMS and email have been dispatched to your contact.'}
                </p>
              </div>

              {/* Order summary pill */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.orderIdLabel}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {createdOrder.id}
                  </span>
                </div>
                {createdOrder.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {createdOrder.transactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.courierPartner}</span>
                  <span className="font-semibold">{createdOrder.courierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.estimatedTime}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {createdOrder.estimatedDelivery}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenTracking(createdOrder.id);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Truck className="w-4 h-4" />
                  <span>{t.trackNow}</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {t.continueShopping}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
