import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  MapPin, 
  Phone, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { Language, Order, OrderStatus } from '../types';
import { translations } from '../translations';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  language: Language;
  initialOrderId?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  language,
  initialOrderId = '',
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [searchId, setSearchId] = useState(initialOrderId || (orders.length > 0 ? orders[0].id : 'ORD-1001'));
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>(
    orders.find((o) => o.id.toLowerCase() === searchId.trim().toLowerCase()) || orders[0]
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchId.trim().toLowerCase();
    const found = orders.find((o) => o.id.toLowerCase() === query);
    if (found) {
      setSelectedOrder(found);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  const statusSteps: { key: OrderStatus; label: string; icon: any }[] = [
    { key: 'placed', label: t.step_placed, icon: Package },
    { key: 'confirmed', label: t.step_confirmed, icon: CheckCircle2 },
    { key: 'packed', label: t.step_packed, icon: Package },
    { key: 'shipped', label: t.step_shipped, icon: Truck },
    { key: 'out_for_delivery', label: t.step_out, icon: Truck },
    { key: 'delivered', label: t.step_delivered, icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 0;
      case 'confirmed': return 1;
      case 'packed': return 2;
      case 'shipped': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = selectedOrder ? getStepIndex(selectedOrder.orderStatus) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="order-tracking-modal"
        className="relative w-full max-w-2xl flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 className="text-base font-bold">{t.orderTrackingTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tracking modal"
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  setNotFound(false);
                }}
                placeholder={t.enterOrderId}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all shadow-sm"
            >
              {t.searchOrder}
            </button>
          </form>

          {notFound && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              {language === 'bn' ? 'অর্ডার নম্বরটি খুঁজে পাওয়া যায়নি! সঠিক নম্বর দিয়ে আবার চেষ্টা করুন।' : 'Order ID not found. Please verify the order number.'}
            </div>
          )}

          {/* Quick Demo Selector Chips */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{language === 'bn' ? 'উদাহরণ অর্ডার:' : 'Demo Orders:'}</span>
            {orders.slice(0, 3).map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSearchId(o.id);
                  setSelectedOrder(o);
                  setNotFound(false);
                }}
                className={`px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                  selectedOrder?.id === o.id
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {o.id}
              </button>
            ))}
          </div>

          {/* Active Order Details */}
          {selectedOrder && (
            <div className="space-y-6 pt-2">
              
              {/* Order Meta Header */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedOrder.id}
                    </span>
                    {selectedOrder.isExpressDelivery && (
                      <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Zap className="w-3 h-3 fill-current" />
                        {t.expressBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500">{t.estimatedTime}</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedOrder.estimatedDelivery}
                  </p>
                </div>
              </div>

              {/* Visual 6-Step Milestone Timeline */}
              <div className="relative pt-2">
                <div className="space-y-4">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex items-start gap-3.5 relative">
                        {/* Connecting Line */}
                        {idx !== statusSteps.length - 1 && (
                          <div 
                            className={`absolute left-4 top-8 -bottom-4 w-0.5 transition-colors ${
                              idx < currentStepIdx 
                                ? 'bg-emerald-500' 
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`} 
                          />
                        )}

                        {/* Icon Node */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          isCompleted
                            ? isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                              : 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="pt-1 flex-1">
                          <p className={`text-xs font-bold ${
                            isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-pulse mt-0.5">
                              ● {language === 'bn' ? 'বর্তমান পর্যায়' : 'Current Status'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery info details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-400 text-[11px]">{t.courierPartner}</p>
                  <p className="font-semibold">{selectedOrder.courierName}</p>
                  <p className="text-[11px] font-mono text-slate-500">Tracking: {selectedOrder.trackingNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-[11px]">{t.fullAddress}</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-[11px] text-slate-500">{selectedOrder.address}, {selectedOrder.city}</p>
                </div>
              </div>

              {/* Products in order */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'অর্ডারের পণ্যসমূহ:' : 'Items in this Order:'}
                </p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                  {selectedOrder.items.map((it) => (
                    <div key={it.productId} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={it.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {language === 'bn' ? it.productNameBn : it.productNameEn} (x{it.quantity})
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {t.bdt}{(it.price * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Close Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'অর্ডার ট্র্যাকিং বন্ধ করতে:' : 'To close tracking window:'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন (Close)' : 'Close'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
