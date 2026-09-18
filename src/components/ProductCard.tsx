import React from 'react';
import { Star, Zap, ShoppingCart, Eye } from 'lucide-react';
import { Language, Product } from '../types';
import { translations } from '../translations';

interface ProductCardProps {
  product: Product;
  language: Language;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  onAddToCart,
  onViewDetails,
}) => {
  const t = translations[language];
  const name = language === 'bn' ? product.nameBn : product.nameEn;
  const description = language === 'bn' ? product.descriptionBn : product.descriptionEn;

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-700/50">
        <img
          src={product.imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.isExpressDelivery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 text-white px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-xs">
              <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
              {t.expressBadge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex items-center rounded-full bg-rose-500 text-white px-2 py-0.5 text-[11px] font-bold shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Button Overlay */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <button
            onClick={() => onViewDetails(product)}
            className="px-3.5 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white text-xs font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            {t.viewDetails}
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        
        {/* Rating & Stock */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
          </div>

          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
            product.stock > 10 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
              : product.stock > 0 
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
          }`}>
            {product.stock > 0 
              ? `${product.stock} ${t.onlyLeft}` 
              : t.outOfStock}
          </span>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onViewDetails(product)}
          className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors leading-snug"
        >
          {name}
        </h3>

        {/* Description preview */}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          {description}
        </p>

        <div className="mt-auto pt-3">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {t.bdt}{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                {t.bdt}{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            id={`add-to-cart-btn-${product.id}`}
            disabled={product.stock <= 0}
            onClick={() => onAddToCart(product)}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              product.stock > 0
                ? 'bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white active:scale-98'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{product.stock > 0 ? t.addToCart : t.outOfStock}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
