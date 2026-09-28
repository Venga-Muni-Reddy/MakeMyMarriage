import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Globe,
  ChevronDown,
  Check,
  Ticket,
  Calendar,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Tab State: 'host' (Couple & Host) vs 'guest' (Guest VIP Pass)
  const [activeTab, setActiveTab] = useState<'host' | 'guest'>('host');

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [vipCode, setVipCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Language Dropdown
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'te'>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as const, label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te' as const, label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: identifier, password, rememberMe });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Guest VIP Pass Submit:', { vipCode });
    navigate(`/invite/${vipCode || 'sample-vip-pass'}`);
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* 1. TOP AMBIENT STRIP & HEADER */}
      {/* ========================================================================= */}
      <header className="w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 py-3.5 px-4 sm:px-6 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
              <Heart className="w-4 h-4 fill-primary text-primary" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-on-surface">
              MakeMy<span className="text-primary italic">Marriage</span>
            </span>
          </Link>

          {/* Right Header Badges */}
          <div className="flex items-center space-x-3">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-medium text-on-surface transition-all shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>
                  {languages.find((l) => l.code === selectedLang)?.flag}{' '}
                  {languages.find((l) => l.code === selectedLang)?.native}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isLangDropdownOpen ? 'rotate-180 text-primary' : 'text-on-surface-variant'
                  }`}
                />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl py-1.5 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        selectedLang === lang.code
                          ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.native}</span>
                      </div>
                      {selectedLang === lang.code && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-primary hover:text-primary-container transition-colors"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SPLIT / CENTERED CARD CONTAINER */}
      {/* ========================================================================= */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl rounded-3xl bg-surface-container-lowest shadow-2xl border border-outline-variant/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* ------------------------------------------------------------- */}
          {/* Left Column: Visual Palace Showcase (Editorial Majesty) */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 text-white overflow-hidden bg-stone-900">
            {/* Background Image with Dark Vignette */}
            <img
              src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80"
              alt="Opulent Heritage Palace Courtyard"
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

            {/* Top Badge */}
            <div className="relative z-10">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-widest uppercase text-primary-fixed">
                <Sparkles className="w-3.5 h-3.5 text-primary-fixed" />
                <span>Sacred Celebrations Ecosystem</span>
              </span>
            </div>

            {/* Middle Quote */}
            <div className="relative z-10 my-auto py-12">
              <span className="font-serif text-5xl text-primary-fixed/40 leading-none block -mb-4">“</span>
              <h2 className="font-serif text-3xl font-semibold leading-snug tracking-tight text-white mb-3">
                Where Sacred Vows Meet Modern Elegance.
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed max-w-sm">
                From auspicious Muhurtham countdowns to royal guest concierge and real-time ceremony itineraries.
              </p>
            </div>

            {/* Bottom Auspicious Strip */}
            <div className="relative z-10 p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center text-primary-fixed">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider">Current Season</p>
                  <p className="font-semibold text-white">4,820+ Weddings Active</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-white">
                Subh Muhurat
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Right Column: Royal Authentication Portal */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            {/* Mobile Visual Banner (Only visible on small screens) */}
            <div className="lg:hidden relative h-36 rounded-2xl overflow-hidden mb-6 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
                alt="Palace Courtyard"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white text-center">
                <p className="font-serif text-base italic text-primary-fixed font-medium">
                  "Where Sacred Vows Meet Modern Elegance"
                </p>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary-fixed mx-auto mb-3 flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
                <Heart className="w-6 h-6 fill-primary text-primary" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                Welcome to Your Celebration
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
                Sign in to manage your auspicious ceremonies, royal guest list, and bespoke invitations.
              </p>
            </div>

            {/* Segmented Tab Switcher (Host vs VIP Guest) */}
            <div className="w-full bg-surface-container-high p-1 rounded-xl flex items-center mb-6 shadow-inner border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setActiveTab('host')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'host'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Couple & Host</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guest')}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'guest'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Guest VIP Pass</span>
              </button>
            </div>

            {/* TAB 1: Host Form */}
            {activeTab === 'host' && (
              <form onSubmit={handleHostSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Input: Email or WhatsApp */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1.5">
                    Registered Email or WhatsApp
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low border border-outline-variant/40 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                    <Mail className="absolute left-3.5 w-4 h-4 text-primary" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="radhika.mehta@royalvows.in or +91 98..."
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline-variant focus:outline-none"
                    />
                  </div>
                </div>

                {/* Input: Password */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-tertiary">
                      Royal Suite Password
                    </label>
                    <a
                      href="#forgot"
                      className="text-xs text-primary hover:text-primary-container transition-colors font-medium"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low border border-outline-variant/40 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                    <Lock className="absolute left-3.5 w-4 h-4 text-primary" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline-variant focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-outline hover:text-on-surface transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary cursor-pointer"
                    />
                    <span className="text-xs text-on-surface-variant font-medium">
                      Keep this device blessed & logged in
                    </span>
                  </label>
                  <span className="inline-flex items-center space-x-1 text-primary-container text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-secondary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#881337] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Wedding Suite'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            )}

            {/* TAB 2: Guest VIP Pass Form */}
            {activeTab === 'guest' && (
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-on-surface">
                      Attending as an Honored Guest?
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Enter your invitation access code or phone number to view ceremonial itineraries and gift registry.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tertiary mb-1.5">
                    Invitation Passcode or RSVP Token
                  </label>
                  <div className="relative flex items-center rounded-xl bg-surface-container-low border border-outline-variant/40 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                    <Ticket className="absolute left-3.5 w-4 h-4 text-primary" />
                    <input
                      type="text"
                      required
                      value={vipCode}
                      onChange={(e) => setVipCode(e.target.value.toUpperCase())}
                      placeholder="e.g. JAIPUR-2026"
                      maxLength={12}
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-sm font-semibold tracking-wider text-on-surface placeholder:text-outline-variant focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-tertiary active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enter Wedding Pavilion</span>
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative flex py-4 items-center justify-center">
              <div className="w-full h-px bg-outline-variant/30" />
              <span className="absolute px-3 bg-surface-container-lowest text-primary font-serif text-xs italic tracking-widest">
                ✦ Or continue with ✦
              </span>
            </div>

            {/* Social Authentication Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* WhatsApp Quick Verify */}
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-surface-container-low hover:bg-surface-container rounded-xl border border-outline-variant/30 text-on-surface text-xs font-semibold shadow-sm transition-all"
              >
                <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>WhatsApp</span>
              </button>

              {/* Google Authentication */}
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-surface-container-low hover:bg-surface-container rounded-xl border border-outline-variant/30 text-on-surface text-xs font-semibold shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.24C.45 8.23 0 10.06 0 12s.45 3.77 1.24 5.39l4.04-3.13z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.61l4.04 3.13c.95-2.84 3.6-4.99 6.72-4.99z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>

            {/* Footer Navigation & Security */}
            <div className="text-center space-y-3 pt-2">
              <p className="text-xs text-on-surface-variant">
                Don't have a wedding workspace yet?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-secondary hover:underline transition-all"
                >
                  Create Your Wedding Free →
                </Link>
              </p>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-surface-container rounded-full text-[11px] text-outline">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>256-Bit Bank-Grade Encryption • Ceremonial Privacy Assured</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. COMPACT FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full py-4 text-center text-xs text-on-surface-variant border-t border-outline-variant/30">
        <p>© 2026 MakeMyMarriage. Crafted for modern Indian weddings.</p>
      </footer>
    </div>
  );
};
