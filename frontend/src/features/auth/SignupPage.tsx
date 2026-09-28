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
  User,
  Phone,
  Star,
  QrCode,
  Calendar,
  Tv,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Persona State
  const [selectedRole, setSelectedRole] = useState<'bride' | 'groom' | 'family' | 'planner'>('bride');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi' | 'te'>('en');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Top Nav Language Dropdown
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

  // Compute Password Strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Enter Password', color: 'bg-stone-200' };
    if (pwd.length < 6) return { score: 1, label: 'Gentle', color: 'bg-rose-400' };
    if (pwd.length < 10) return { score: 2, label: 'Noble', color: 'bg-amber-400' };
    return { score: 4, label: 'Imperial Strength', color: 'bg-primary-container' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({
        name: fullName,
        email,
        password,
        preferredLanguage: preferredLang,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER */}
      {/* ========================================================================= */}
      <header className="w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 py-3.5 px-4 sm:px-6 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
              <Heart className="w-4 h-4 fill-primary text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-on-surface leading-tight">
                MakeMy<span className="text-primary italic">Marriage</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Concierge & Suite
              </span>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-medium text-on-surface transition-all shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>
                  {languages.find((l) => l.code === preferredLang)?.flag}{' '}
                  {languages.find((l) => l.code === preferredLang)?.native}
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
                        setPreferredLang(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        preferredLang === lang.code
                          ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.native}</span>
                      </div>
                      {preferredLang === lang.code && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span>Already have a suite?</span>
              <span className="text-secondary font-bold hover:underline flex items-center">
                Sign In <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN REGISTRATION SUITE (SPLIT DESKTOP / STACKED MOBILE) */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full flex flex-col lg:flex-row">
        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: Regal Editorial Showcase */}
        {/* ------------------------------------------------------------- */}
        <div className="relative w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[520px] lg:min-h-auto text-white bg-stone-900">
          {/* Background Image with Warm Royal Lighting */}
          <img
            src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=80"
            alt="Opulent Palace Terrace with Royal Couple"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          />
          {/* Deep Wine / Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-secondary/70 to-black/75" />

          {/* Top Pill */}
          <div className="relative z-10">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-widest uppercase text-primary-fixed">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span>The Sovereign Suite • Palace Grade</span>
            </span>
          </div>

          {/* Center Editorial Narrative */}
          <div className="relative z-10 my-auto py-10 max-w-lg">
            <div className="inline-flex items-center space-x-2 text-primary-fixed text-xs tracking-widest uppercase font-semibold mb-3">
              <span>Bespoke Concierge</span>
              <span className="w-6 h-px bg-primary-fixed/60" />
              <span>Est. 2026</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.15] tracking-tight mb-4 text-white">
              Begin Your Forever with{' '}
              <span className="italic font-normal text-primary-fixed">Sovereign Grace.</span>
            </h1>

            <p className="text-sm text-stone-200 leading-relaxed font-light mb-8">
              Step into an elevated realm of wedding orchestration where timeless royal traditions seamlessly align with effortless modern technology.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <Sparkles className="w-4 h-4 text-primary-fixed shrink-0" />
                <span className="text-xs font-medium text-white">Bespoke Gold-Foil Invitations</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <Calendar className="w-4 h-4 text-primary-fixed shrink-0" />
                <span className="text-xs font-medium text-white">Multi-Event Haldi to Reception</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <QrCode className="w-4 h-4 text-primary-fixed shrink-0" />
                <span className="text-xs font-medium text-white">Fast-Track Palace QR Entry</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <Tv className="w-4 h-4 text-primary-fixed shrink-0" />
                <span className="text-xs font-medium text-white">4K Global Stream for Guests</span>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof Badge */}
          <div className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-4 shadow-lg">
            <div className="flex -space-x-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs border border-white">
                JP
              </div>
              <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs border border-white">
                RK
              </div>
              <div className="w-9 h-9 rounded-full bg-[#7a5912] text-white flex items-center justify-center font-bold text-xs border border-white">
                SM
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1 text-primary-fixed mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary-fixed" />
                ))}
                <span className="text-xs font-bold text-white ml-1">99.4% Attendance Rate</span>
              </div>
              <p className="text-xs text-stone-300">Loved by 850+ celebration hosts across Udaipur, Jaipur & Goa</p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: Workspace Registration Suite */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-surface">
          <div className="w-full max-w-xl space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <span className="w-6 h-0.5 bg-primary-container" />
                <span>Palace Concierge Onboarding</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                Create Your Wedding Workspace
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Set up your royal suite in under 2 minutes. Free to start, no credit card required.
              </p>
            </div>

            {/* Persona Selector Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Your Role in the Celebration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bride' as const, label: 'Bride', emoji: '👰' },
                  { id: 'groom' as const, label: 'Groom', emoji: '🤵' },
                  { id: 'family' as const, label: 'Family Host', emoji: '👨‍👩‍👧' },
                  { id: 'planner' as const, label: 'Planner', emoji: '📋' },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                      selectedRole === role.id
                        ? 'bg-secondary/10 border-secondary text-secondary shadow-sm ring-1 ring-secondary'
                        : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant hover:border-primary-container hover:text-on-surface'
                    }`}
                  >
                    <span>{role.emoji}</span>
                    <span>{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Legal Name
                </label>
                <div className="relative flex items-center rounded-xl bg-surface-container-lowest border border-outline-variant/70 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                  <User className="absolute left-3.5 w-4 h-4 text-outline" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Radhika Mehta"
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center rounded-xl bg-surface-container-lowest border border-outline-variant/70 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                  <Mail className="absolute left-3.5 w-4 h-4 text-outline" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              {/* WhatsApp / Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    WhatsApp & Mobile Number
                  </label>
                  <span className="text-[11px] text-tertiary font-medium">For Instant RSVP Dispatch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-3 py-3 rounded-xl bg-surface-container border border-outline-variant/70 text-xs font-semibold text-on-surface shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <div className="relative flex-1 flex items-center rounded-xl bg-surface-container-lowest border border-outline-variant/70 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                    <Phone className="absolute left-3.5 w-4 h-4 text-outline" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Royal Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Royal Password
                </label>
                <div className="relative flex items-center rounded-xl bg-surface-container-lowest border border-outline-variant/70 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
                  <Lock className="absolute left-3.5 w-4 h-4 text-outline" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-11 py-3 bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-outline hover:text-on-surface transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="flex items-center justify-between gap-3 pt-1.5">
                  <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-colors ${
                          step <= strength.score ? strength.color : 'bg-surface-container-highest'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-primary flex items-center space-x-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{strength.label}</span>
                  </span>
                </div>
              </div>

              {/* Preferred RSVP Language Chips */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Preferred Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: 'en' as const, label: 'English (Global)' },
                    { code: 'hi' as const, label: 'हिन्दी (Hindi)' },
                    { code: 'te' as const, label: 'తెలుగు (Telugu)' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setPreferredLang(lang.code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        preferredLang === lang.code
                          ? 'bg-primary-container text-on-primary-container shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant hover:border-primary-container'
                      }`}
                    >
                      {preferredLang === lang.code ? `✓ ${lang.label}` : lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sacred Privacy Agreement Checkbox */}
              <div className="flex items-start space-x-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary cursor-pointer mt-0.5"
                />
                <label htmlFor="agree-terms" className="text-xs text-on-surface-variant leading-relaxed select-none cursor-pointer">
                  I agree to the{' '}
                  <span className="text-secondary font-medium hover:underline">Sacred Privacy Policy</span> and the sovereign{' '}
                  <span className="text-secondary font-medium hover:underline">Terms of Palace Hospitality</span>.
                </label>
              </div>

              {/* Primary Royal Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-secondary text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#881337] transition-all flex items-center justify-center space-x-2 group hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Creating Royal Suite...' : 'Begin Wedding Journey Free'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center space-x-3 pt-2">
              <div className="flex-1 h-px bg-outline-variant/40" />
              <span className="text-[11px] uppercase tracking-widest text-on-surface-variant/80 font-serif">
                ✦ Or sign up with ✦
              </span>
              <div className="flex-1 h-px bg-outline-variant/40" />
            </div>

            {/* 1-Click Verification Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp */}
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/70 hover:border-primary-container text-on-surface text-xs font-semibold shadow-xs transition-all"
              >
                <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>WhatsApp One-Touch</span>
              </button>

              {/* Google */}
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/70 hover:border-primary-container text-on-surface text-xs font-semibold shadow-xs transition-all"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google Account</span>
              </button>
            </div>

            {/* Trust Assurance Strip */}
            <div className="pt-2 flex items-center justify-center text-center">
              <div className="inline-flex items-center space-x-2 py-1 px-3.5 rounded-full bg-surface-container text-[11px] text-on-surface-variant font-medium">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>256-Bit TLS Bank Encryption</span>
                <span className="text-outline-variant">•</span>
                <span>Zero Spam Policy</span>
                <span className="text-outline-variant">•</span>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. COMPACT FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full bg-surface-container-low py-4 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 MakeMyMarriage Royal Suites & Concierge. All Rights Reserved.</span>
          <div className="flex items-center space-x-4">
            <span className="hover:text-primary cursor-pointer transition-colors">Concierge Support</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy & Discretion</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Grace</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
