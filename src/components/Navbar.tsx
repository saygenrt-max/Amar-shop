import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Moon, 
  Sun, 
  Truck, 
  Download, 
  ShieldCheck, 
  User as UserIcon, 
  Languages, 
  X,
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { Language, Theme, User } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  theme: Theme;
  onToggleTheme: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onOpenSourceCode: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileFilters: () => void;
  firebaseStatus?: 'connecting' | 'connected' | 'offline' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  theme,
  onToggleTheme,
  cartCount,
  onOpenCart,
  onOpenTracking,
  onOpenSourceCode,
  onOpenAuth,
  onOpenAdmin,
  currentUser,
  searchQuery,
  onSearchChange,
  onToggleMobileFilters,
  firebaseStatus = 'connected',
}) => {
  const t = translations[language];
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 border-b bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
      {/* Top micro announcement bar */}
      <div className="bg-emerald-600 text-white text-xs py-1 px-4 text-center font-medium flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5 animate-pulse" />
          {t.fastDeliveryBanner}
        </span>
        <span className="hidden md:inline text-emerald-200">|</span>
        <span className="hidden md:inline">{t.securityBanner}</span>
        <span className="hidden md:inline text-emerald-200">|</span>
        <span className="inline-flex items-center gap-1.5 bg-emerald-700/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-400/30">
          <span className={`w-2 h-2 rounded-full ${firebaseStatus === 'connected' ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
          <span>
            {firebaseStatus === 'connected' 
              ? (language === 'bn' ? '🔥 ফায়ারবেস ক্লাউড ডিবি কানেক্টেড' : '🔥 Firebase Cloud DB Connected')
              : (language === 'bn' ? 'ডাটাবেজ সিঙ্ক হচ্ছে...' : 'Syncing Cloud DB...')}
          </span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 md:gap-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl">অ</span>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  {t.brandName}
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                    PRO
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  {t.tagline}
                </p>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg hidden sm:block relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={onToggleMobileFilters}
              className="p-2 sm:hidden rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => onToggleLanguage(language === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'light' ? t.darkMode : t.lightMode}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Order Tracking Button */}
            <button
              onClick={onOpenTracking}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.trackOrder}</span>
            </button>

            {/* Source Code Download Button (User explicitly requested prominent button) */}
            <button
              onClick={onOpenSourceCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs"
              title={t.sourceCode}
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">{t.sourceCode}</span>
              <span className="md:hidden">সোর্স কোড</span>
            </button>

            {/* Admin Dashboard Quick Access */}
            <button
              onClick={onOpenAdmin}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-xs"
              title={t.adminPanel}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.adminPanel}</span>
            </button>

            {/* User Account / 2FA Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  if (currentUser) {
                    setShowUserMenu(!showUserMenu);
                  } else {
                    onOpenAuth();
                  }
                }}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
                <span className="hidden xl:inline max-w-[90px] truncate">
                  {currentUser ? currentUser.name.split(' ')[0] : t.login}
                </span>
                {currentUser?.twoFactorEnabled && (
                  <span title="2FA Active" className="hidden sm:inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              {showUserMenu && currentUser && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-medium">{t.account}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t.twoFactorEnabledBadge}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAdmin();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                    {t.adminPanel}
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenTracking();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-emerald-500" />
                    {t.trackOrder}
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>

            {/* Cart Icon & Counter */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search input bar */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-emerald-500 outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
