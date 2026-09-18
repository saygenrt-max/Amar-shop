import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  User as UserIcon, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Check,
  Send,
  ExternalLink
} from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import { FirebaseService } from '../services/firebase';
import { StorageService } from '../services/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

type AuthMode = 
  | 'login' 
  | 'register' 
  | 'verify_register' 
  | 'forgot' 
  | 'verify_forgot' 
  | 'new_password' 
  | '2fa';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  // Core Form State
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@amarshop.com');
  const [phone, setPhone] = useState('01700000000');
  const [password, setPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);

  // 4-Digit Email OTP state
  const [inputOtp, setInputOtp] = useState('');
  const [active4DigitCode, setActive4DigitCode] = useState('');
  const [emailDispatchedAlert, setEmailDispatchedAlert] = useState(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<{
    delivered: boolean;
    method?: string;
    reason?: string;
    error?: string;
  } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // 2FA state for 6-digit legacy 2FA
  const [twoFaCode, setTwoFaCode] = useState('123456');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Clear messages on mode switch
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMsg('');
    setInputOtp('');
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const isAdmin = cleanEmail.includes('admin');

      // Check local storage users & firestore
      const localUsers = StorageService.getUsers();
      let matchedUser = localUsers.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);

      if (!matchedUser) {
        matchedUser = await FirebaseService.findUserByEmail(cleanEmail) || undefined;
      }

      // If user found with a password set, verify it
      if (matchedUser && matchedUser.password && matchedUser.password !== password) {
        setErrorMessage(language === 'bn' ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password! Please check and try again.');
        setIsProcessing(false);
        return;
      }

      // Construct user if not found
      const user: User = matchedUser || {
        id: isAdmin ? 'user-admin' : `user-${Date.now()}`,
        name: isAdmin ? 'Admin Manager' : name || 'Valued Customer',
        email: cleanEmail,
        phone,
        role: isAdmin ? 'admin' : 'customer',
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        avatar: isAdmin 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      };

      if (user.twoFactorEnabled) {
        setPendingUser(user);
        setMode('2fa');
      } else {
        StorageService.setCurrentUser(user);
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Step 1 of Register: Send 4-Digit Code to Email & save to Firebase
  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    if (password.length < 4) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      setIsProcessing(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Generate 4-digit code, store in Firebase Firestore, and deliver via server
      const { code, delivery } = await FirebaseService.sendVerificationCode(cleanEmail, 'register', {
        name: name.trim(),
        phone: phone.trim(),
        password,
        enable2FA,
      });

      setActive4DigitCode(code);
      setEmailDeliveryStatus(delivery || null);
      setInputOtp('');
      setEmailDispatchedAlert(true);
      setResendCooldown(60); // 60s cooldown
      setMode('verify_register');
    } catch (err: any) {
      setErrorMessage(language === 'bn' ? 'কোড পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to send code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 of Register: Verify 4-Digit Code & Create User Account
  const handleVerifyRegisterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    const cleanEmail = email.trim().toLowerCase();
    const result = await FirebaseService.verifyEmailCode(cleanEmail, inputOtp, 'register');

    if (!result.success) {
      setErrorMessage(result.message);
      setIsProcessing(false);
      return;
    }

    try {
      // Create user account
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim() || 'AmarShop Customer',
        email: cleanEmail,
        phone: phone.trim(),
        role: 'customer',
        twoFactorEnabled: enable2FA,
        createdAt: new Date().toISOString(),
        password,
      };

      // Save user to Firebase Firestore
      await FirebaseService.saveUser(newUser);

      // Save user locally in storage
      const existingUsers = StorageService.getUsers();
      StorageService.saveUsers([newUser, ...existingUsers.filter(u => u.email !== cleanEmail)]);
      StorageService.setCurrentUser(newUser);

      setSuccessMsg(language === 'bn' 
        ? 'অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।' 
        : 'Congratulations! Your account was created successfully.');

      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(language === 'bn' ? 'অ্যাকাউন্ট সংরক্ষণে সমস্যা হয়েছে।' : 'Error saving user account.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Step 1 of Forgot Password: Send 4-Digit Code to Email
  const handleForgotInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Generate 4-digit code and store in Firebase Firestore
      const { code, delivery } = await FirebaseService.sendVerificationCode(cleanEmail, 'forgot_password');

      setActive4DigitCode(code);
      setEmailDeliveryStatus(delivery || null);
      setInputOtp('');
      setEmailDispatchedAlert(true);
      setResendCooldown(60);
      setMode('verify_forgot');
    } catch (err: any) {
      setErrorMessage(language === 'bn' ? 'কোড পাঠাতে সমস্যা হয়েছে।' : 'Failed to send code.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 of Forgot Password: Verify 4-Digit Code
  const handleVerifyForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    const cleanEmail = email.trim().toLowerCase();
    const result = await FirebaseService.verifyEmailCode(cleanEmail, inputOtp, 'forgot_password');

    if (!result.success) {
      setErrorMessage(result.message);
      setIsProcessing(false);
      return;
    }

    // Code verified! Switch to setting new password
    setMode('new_password');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsProcessing(false);
  };

  // Step 3 of Forgot Password: Save New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 4) {
      setErrorMessage(language === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(language === 'bn' ? 'উভয় পাসওয়ার্ড একই হতে হবে।' : 'Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Update in Firebase Firestore
      await FirebaseService.updateUserPassword(cleanEmail, newPassword);

      // 2. Update in Local Storage
      const localUsers = StorageService.getUsers();
      const updatedUsers = localUsers.map((u) => {
        if (u.email && u.email.trim().toLowerCase() === cleanEmail) {
          return { ...u, password: newPassword };
        }
        return u;
      });
      StorageService.saveUsers(updatedUsers);

      setSuccessMsg(language === 'bn' 
        ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।' 
        : 'Password updated successfully! Please log in with your new password.');

      setPassword(newPassword);
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('');
      }, 1600);
    } catch (err: any) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড আপডেটে সমস্যা হয়েছে।' : 'Failed to update password.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Resend 4-digit code helper
  const handleResendCode = async (purpose: 'register' | 'forgot_password') => {
    if (resendCooldown > 0) return;
    setIsProcessing(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { code, delivery } = await FirebaseService.sendVerificationCode(cleanEmail, purpose, {
        name,
        phone,
        password,
        enable2FA,
      });
      setActive4DigitCode(code);
      setEmailDeliveryStatus(delivery || null);
      setResendCooldown(60);
      setEmailDispatchedAlert(true);
      setErrorMessage('');
    } catch (e) {
      setErrorMessage('কোড পুনরায় পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2FA Verification
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingUser) {
      StorageService.setCurrentUser(pendingUser);
      onLoginSuccess(pendingUser);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="auth-modal"
        className="relative w-full max-w-md flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {mode === 'login' && t.welcomeBack}
              {mode === 'register' && t.createAccount}
              {mode === 'verify_register' && (language === 'bn' ? '৪ সংখ্যার কোড দিয়ে অ্যাকাউন্ট তৈরি' : 'Verify 4-Digit Email Code')}
              {mode === 'forgot' && t.resetPassword}
              {mode === 'verify_forgot' && (language === 'bn' ? 'পাসওয়ার্ড রিসেট কোড যাচাই' : 'Verify 4-Digit Reset Code')}
              {mode === 'new_password' && (language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password')}
              {mode === '2fa' && t.twoFactorTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {currentUser ? (
            /* Logged in state view */
            <div className="space-y-4 text-center">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'} 
                alt="" 
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-emerald-500 shadow-md"
              />
              <div>
                <h3 className="text-base font-bold">{currentUser.name}</h3>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                  {currentUser.role}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-emerald-600 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'bn' ? 'ফায়ারবেস ক্লাউড সুরক্ষিত অ্যাকাউন্ট' : 'Firebase Cloud Secured Account'}</span>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <>
              {/* Error & Success Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ---------------- 1. LOGIN FORM ---------------- */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{t.forgotPassword}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{t.login}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn' ? 'নতুন ইউজার? অ্যাকাউন্ট খুলুন' : "New user? Create an account"}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-emerald-600 hover:underline cursor-pointer ml-1"
                    >
                      {language === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Register now'}
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- 2. REGISTER FORM (Step 1: Input details) ---------------- */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterInitiate} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.fullName} *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="যেমন: সাকিব আল হাসান"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.phone} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.email} * ({language === 'bn' ? 'কোড এই ইমেইলে যাবে' : 'OTP will be sent here'})
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.password} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      {language === 'bn'
                        ? 'রেজিস্ট্রেশনের জন্য আপনার ইমেইলে একটি ৪ সংখ্যার ভেরিফিকেশন কোড পাঠানো হবে।'
                        : 'A 4-digit email verification code will be sent to confirm registration.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? '৪ সংখ্যার কোড পাঠান ও এগিয়ে যান' : 'Send 4-Digit Code & Continue'}</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    {language === 'bn' ? 'আগে থেকেই অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      {t.login}
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- 3. VERIFY REGISTER 4-DIGIT OTP STEP ---------------- */}
              {mode === 'verify_register' && (
                <form onSubmit={handleVerifyRegisterCode} className="space-y-4">
                  {/* Email dispatch alert banner */}
                  {emailDispatchedAlert && (
                    <>
                      {emailDeliveryStatus?.delivered ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                                  {language === 'bn' ? '💌 আপনার Gmail ইনবক্সে কোড পাঠানো হয়েছে!' : '💌 Code sent to your Gmail inbox!'}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                                  {language === 'bn' ? 'প্রেরিত' : 'Sent'}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">
                                {email}
                              </p>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                                {language === 'bn'
                                  ? 'অনুগ্রহ করে আপনার Gmail অ্যাপ বা mail.google.com এর Inbox বা Spam ফোল্ডার চেক করুন। AmarShop থেকে প্রেরিত ৪ সংখ্যার কোডটি কপি করে নিচের বক্সে লিখুন।'
                                  : 'Please check your Gmail app or mail.google.com (Inbox or Spam folder). Copy the 4-digit code and paste it below.'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                            <a
                              href="https://mail.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'Gmail ইনবক্স খুলুন' : 'Open Gmail Inbox'}</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                              {language === 'bn' ? '⏱️ মেয়াদ: ১০ মিনিট' : '⏱️ Valid for: 10 mins'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 space-y-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-100">
                                {language === 'bn' 
                                  ? 'Gmail ইনবক্সে সরাসরি কোড পেতে Settings কনফিগারেশন' 
                                  : 'Configure Settings to deliver directly to real Gmail'}
                              </h4>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                                {language === 'bn'
                                  ? `আপনার ব্যক্তিগত Gmail (${email}) এ সরাসরি ইমেইল পাঠাতে Settings থেকে GMAIL_USER ও GMAIL_APP_PASSWORD যুক্ত করুন।`
                                  : `To deliver emails directly to ${email}, add GMAIL_USER and GMAIL_APP_PASSWORD in AI Studio Settings.`}
                              </p>
                            </div>
                          </div>

                          {/* Fallback OTP for testing */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                                {language === 'bn' ? 'বর্তমান ভেরিফিকেশন ওটিপি' : 'Current Verification OTP'}
                              </span>
                              <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                                {active4DigitCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setInputOtp(active4DigitCode);
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 2000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>{language === 'bn' ? 'কোড বসান' : 'Fill Code'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t.emailOtpSubtitle}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {language === 'bn' ? '৪ সংখ্যার গোপনীয় কোড প্রদান করুন' : 'Enter the 4-digit code to finalize registration'}
                    </p>
                  </div>

                  {/* 4-digit numeric code input */}
                  <div className="flex justify-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoFocus
                      required
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-44 text-center text-2xl tracking-[0.6em] font-mono font-bold py-2.5 px-3 rounded-2xl border-2 border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || inputOtp.length < 4}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.verifyAndRegisterBtn}</span>
                      </>
                    )}
                  </button>

                  {/* Resend & Back buttons */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'তথ্যাদি পরিবর্তন' : 'Edit details'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isProcessing}
                      onClick={() => handleResendCode('register')}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 
                          ? `${language === 'bn' ? 'পুনরায় পাঠান' : 'Resend in'} (${resendCooldown}s)` 
                          : t.resendCode}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- 4. FORGOT PASSWORD (Step 1: Input email) ---------------- */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotInitiate} className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {language === 'bn'
                        ? 'আপনার নিবন্ধিত ইমেইল লিখুন। পাসওয়ার্ড পরিবর্তনের জন্য একটি ৪ সংখ্যার ভেরিফিকেশন কোড পাঠানো হবে।'
                        : 'Enter your registered email address. A 4-digit verification code will be sent to reset your password.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.email} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.sendResetLink}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-xs text-slate-500 hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- 5. VERIFY FORGOT PASSWORD 4-DIGIT CODE ---------------- */}
              {mode === 'verify_forgot' && (
                <form onSubmit={handleVerifyForgotCode} className="space-y-4">
                  {/* Email dispatched alert */}
                  {emailDispatchedAlert && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                              {language === 'bn' ? 'পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে!' : 'Reset Code Sent to Email!'}
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                              {email}
                            </p>
                          </div>
                        </div>
                        {active4DigitCode && (
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-bold text-sm tracking-widest shadow-xs">
                              {active4DigitCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Auto-fill button */}
                      {active4DigitCode && (
                        <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {language === 'bn' ? 'দ্রুত টেস্টের জন্য অটো-ফিল করুন:' : 'Quick autofill for testing:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInputOtp(active4DigitCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                            <span>{language === 'bn' ? 'কোড বসান' : 'Fill Code'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'পাসওয়ার্ড রিসেটের ৪ সংখ্যার কোড লিখুন:' : 'Enter 4-digit password reset code:'}
                    </p>
                  </div>

                  {/* 4-digit numeric code input */}
                  <div className="flex justify-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoFocus
                      required
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-44 text-center text-2xl tracking-[0.6em] font-mono font-bold py-2.5 px-3 rounded-2xl border-2 border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || inputOtp.length < 4}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.verifyCodeBtn}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ইমেইল পরিবর্তন' : 'Change email'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isProcessing}
                      onClick={() => handleResendCode('forgot_password')}
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 
                          ? `${language === 'bn' ? 'পুনরায় পাঠান' : 'Resend in'} (${resendCooldown}s)` 
                          : t.resendCode}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- 6. NEW PASSWORD STEP ---------------- */}
              {mode === 'new_password' && (
                <form onSubmit={handleSaveNewPassword} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'bn' 
                        ? '৪ সংখ্যার কোড সফলভাবে যাচাই হয়েছে! এবার নতুন পাসওয়ার্ড দিন।' 
                        : 'Code verified successfully! Now set your new password.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.newPasswordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="নতুন পাসওয়ার্ড লিখুন"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                      {t.confirmNewPasswordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t.updatePasswordBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------- 7. 2FA LEGACY OTP STEP ---------------- */}
              {mode === '2fa' && (
                <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mx-auto">
                    <KeyRound className="w-6 h-6" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t.twoFactorPrompt}
                  </p>

                  <div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value)}
                      className="w-48 text-center text-xl tracking-widest font-mono font-bold py-2 px-3 rounded-xl border-2 border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'bn' ? 'পরীক্ষামূলক কোড: ১২৩৪৫৬' : 'Demo OTP: 123456'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md"
                  >
                    {t.verify2FA}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Privacy footnote */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400">
            {t.dataPrivacyNotice}
          </div>
        </div>

        {/* Bottom Close Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'লগইন উইন্ডো বন্ধ করতে:' : 'To exit window:'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন (Close)' : 'Close'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
