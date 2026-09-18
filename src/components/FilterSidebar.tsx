import React from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Star, 
  Zap, 
  Check,
  Tag
} from 'lucide-react';
import { Language, ProductCategory, StoreFilter } from '../types';
import { translations } from '../translations';

interface FilterSidebarProps {
  filter: StoreFilter;
  onChangeFilter: (updated: Partial<StoreFilter>) => void;
  onResetFilter: () => void;
  language: Language;
  totalProductsCount: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filter,
  onChangeFilter,
  onResetFilter,
  language,
  totalProductsCount,
}) => {
  const t = translations[language];

  const categories: { key: ProductCategory; label: string }[] = [
    { key: 'all', label: t.cat_all },
    { key: 'gadgets', label: t.cat_gadgets },
    { key: 'electronics', label: t.cat_electronics },
    { key: 'fashion', label: t.cat_fashion },
    { key: 'groceries', label: t.cat_groceries },
    { key: 'home', label: t.cat_home },
    { key: 'beauty', label: t.cat_beauty },
  ];

  return (
    <aside className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.filters}</h3>
        </div>
        <button
          onClick={onResetFilter}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.resetFilters}</span>
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.allCategories}
        </h4>
        <div className="flex flex-col space-y-1">
          {categories.map((cat) => {
            const isSelected = filter.category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onChangeFilter({ category: cat.key })}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Express Delivery Filter */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {t.expressDeliveryOnly}
            </span>
          </div>
          <input
            type="checkbox"
            checked={filter.onlyExpress}
            onChange={(e) => onChangeFilter({ onlyExpress: e.target.checked })}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-500 uppercase tracking-wider">{t.priceRange}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
            {t.bdt}{filter.maxPrice.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={10000}
          step={200}
          value={filter.maxPrice}
          onChange={(e) => onChangeFilter({ maxPrice: Number(e.target.value) })}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{t.bdt}500</span>
          <span>{t.bdt}10,000+</span>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.ratings}
        </h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((minRating) => {
            const isSelected = filter.ratingFilter === minRating;
            return (
              <button
                key={minRating}
                onClick={() => onChangeFilter({ ratingFilter: isSelected ? 0 : minRating })}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < minRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                  <span className="ml-1">& {language === 'bn' ? 'তার বেশি' : 'up'}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
};
