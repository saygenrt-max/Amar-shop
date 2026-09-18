import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Zap, 
  ShoppingCart, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Minus,
  MessageSquare
} from 'lucide-react';
import { Language, Product, ProductReview } from '../types';
import { translations } from '../translations';

interface ProductDetailModalProps {
  product: Product | null;
  language: Language;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  language,
  onClose,
  onAddToCart,
  onAddReview,
}) => {
  if (!product) return null;

  const t = translations[language];
  const [quantity, setQuantity] = useState(1);
  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const name = language === 'bn' ? product.nameBn : product.nameEn;
  const description = language === 'bn' ? product.descriptionBn : product.descriptionEn;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) return;

    onAddReview(product.id, {
      userName: reviewerName.trim(),
      rating: newRating,
      commentBn: reviewComment.trim(),
      commentEn: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setReviewerName('');
    setReviewComment('');
    setShowReviewForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="product-detail-modal"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/85 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          
          {/* Left: Product Image & Badges */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <img
                src={product.imageUrl}
                alt={name}
                className="w-full h-full object-cover object-center"
              />
              {product.isExpressDelivery && (
                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {t.expressBadge}
                </div>
              )}
            </div>

            {/* Guarantees Box */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-[11px] leading-tight font-medium">
                  <p className="font-semibold">{t.deliveryDays}</p>
                  <p className="text-slate-500 dark:text-slate-400">Dhaka & all BD</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-[11px] leading-tight font-medium">
                  <p className="font-semibold">{t.returnPolicy}</p>
                  <p className="text-slate-500 dark:text-slate-400">{t.authenticGuarantee}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info, Price, Add to Cart & Reviews */}
          <div className="flex flex-col">
            
            {/* Category tag */}
            <div className="inline-block self-start px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase tracking-wider mb-2">
              {product.category}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold leading-snug">
              {name}
            </h1>

            {/* Rating & reviews counter */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {product.reviewsCount} {t.reviews}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 my-4">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {t.bdt}{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  {t.bdt}{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3.5 my-2">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 my-2 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{product.stock > 0 ? `${product.stock} ${t.inStock}` : t.outOfStock}</span>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  product.stock > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 shadow-emerald-600/20'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t.addToCart}</span>
              </button>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  {t.customerReviews} ({product.reviews?.length || 0})
                </h3>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {showReviewForm ? t.cancel : t.writeReview}
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleReviewSubmit} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                      {t.fullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="e.g. Asif Mahmud"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                      {t.yourRating}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                      {t.yourComment}
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your feedback..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    {t.submitReview}
                  </button>
                </form>
              )}

              {/* Review List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-750 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{rev.userName}</span>
                        <span className="text-[11px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                        {rev.verifiedPurchase && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.verifiedBuyer}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {language === 'bn' ? rev.commentBn : rev.commentEn}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No customer reviews yet. Be the first to review!</p>
                )}
              </div>

            </div>

          </div>

        </div>
        </div>

        {/* Bottom Close Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'পণ্যের বিবরণ বন্ধ করতে:' : 'To close product details:'}
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
