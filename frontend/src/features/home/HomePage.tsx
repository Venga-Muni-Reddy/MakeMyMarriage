import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import {
  Heart,
  Calendar,
  Mail,
  QrCode,
  Camera,
  Tv,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Globe,
  Star,
  UtensilsCrossed,
  Clock,
  ChevronDown,
  Check,
} from 'lucide-react';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { currentWedding } = useWedding();
  const dashboardUrl = currentWedding?.id ? `/dashboard/${currentWedding.id}` : '/dashboard';

  // 1. Live Countdown Timer State (Targeting a celebratory wedding date)
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 12,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Language Selection Dropdown State
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

  // 2. Interactive Theme Switcher State
  const [activeTheme, setActiveTheme] = useState<'gold' | 'rose' | 'ivory'>('gold');
  const [rsvpState, setRsvpState] = useState<'none' | 'accepted' | 'declined'>('none');

  const themeConfig = {
    gold: {
      cardBg: 'bg-surface-container-lowest',
      borderColor: 'border-primary-container/40',
      badgeBg: 'bg-primary-fixed text-on-primary-fixed',
      accentColor: 'text-primary',
      tagline: 'Under the Auspices of the Sun Palace',
      names: 'Ananya Singhania & Rahul Kapoor',
      venue: 'City Palace, Udaipur • Rajasthan',
    },
    rose: {
      cardBg: 'bg-secondary-fixed/20',
      borderColor: 'border-secondary/40',
      badgeBg: 'bg-secondary text-on-secondary',
      accentColor: 'text-secondary',
      tagline: 'Under the Starlit Sky of the Pink City',
      names: 'Meera Rajput & Kabir Rathore',
      venue: 'Rambagh Palace, Jaipur • Rajasthan',
    },
    ivory: {
      cardBg: 'bg-surface-container-high',
      borderColor: 'border-outline-variant',
      badgeBg: 'bg-surface-container-highest text-on-surface',
      accentColor: 'text-on-surface',
      tagline: 'Heritage Fort Celebration',
      names: 'Sanjana Reddy & Aditya Varma',
      venue: 'Neemrana Fort Palace • Delhi NCR',
    },
  };

  const currentTheme = themeConfig[activeTheme];

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
              <Heart className="w-5 h-5 fill-primary text-primary" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-on-surface">
              MakeMy<span className="text-primary italic">Marriage</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="text-primary font-semibold transition-colors">
              Features
            </a>
            <a href="#rituals" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Sacred Rituals
            </a>
            <a href="#how-it-works" className="text-on-surface-variant hover:text-on-surface transition-colors">
              How It Works
            </a>
            <a href="#preview" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Live Preview
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Interactive Language Selector Dropdown */}
            <div className="relative hidden md:block" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-xs font-medium text-on-surface transition-all shadow-sm"
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
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-primary border-b border-outline-variant/20 mb-1">
                    Select Language
                  </div>
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
                        <div>
                          <span className="block font-medium">{lang.native}</span>
                          <span className="block text-[10px] text-on-surface-variant">{lang.label}</span>
                        </div>
                      </div>
                      {selectedLang === lang.code && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:inline-block text-xs font-semibold text-on-surface">
                  Namaste, {user?.name?.split(' ')[0] || user?.name || 'Friend'}
                </span>
                <Link
                  to={dashboardUrl}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs sm:text-sm shadow-sm hover:bg-primary/90 transition-all"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-3 py-2 transition-colors"
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-semibold text-sm shadow-sm hover:bg-[#a67933] transition-all"
                >
                  Create Your Wedding
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <main className="pt-24 lg:pt-32">
        {/* Top Ambient Glow */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[980px] h-[520px] bg-gradient-to-b from-primary-fixed-dim/25 via-secondary-fixed/15 to-transparent blur-3xl pointer-events-none -z-10" />

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-6 flex flex-col justify-center pt-2">
                {/* Pill Badge */}
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 shadow-sm w-fit mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                    The Modern Digital Wedding Platform
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-semibold text-on-surface leading-[1.15] tracking-tight mb-6">
                  Every Sacred Ritual, Every Cherished Guest —{' '}
                  <span className="text-primary italic font-normal block sm:inline">Beautifully United.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg text-on-surface-variant leading-relaxed mb-8 max-w-xl">
                  The all-in-one digital companion for your celebration. Design royal invitations, track multi-event RSVPs (Haldi to Reception), enable VIP QR guest entry, and stream live to family across the globe.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  {isAuthenticated ? (
                    <Link
                      to={dashboardUrl}
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-secondary text-white font-semibold text-sm shadow-md hover:bg-[#881337] transition-all hover:shadow-lg"
                    >
                      <span>Continue to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/signup"
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-secondary text-white font-semibold text-sm shadow-md hover:bg-[#881337] transition-all hover:shadow-lg"
                    >
                      <span>Start Planning Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <a
                    href="#preview"
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-surface-container-low text-on-surface font-semibold text-sm shadow-sm hover:bg-surface-container border border-outline-variant/30 transition-all"
                  >
                    <PlayCircle className="w-5 h-5 text-primary fill-primary/20" />
                    <span>Explore Live Sample Invite</span>
                  </a>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 text-xs font-medium text-on-surface-variant mb-6">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>No app download needed</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>WhatsApp & Email delivery</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Instant 2-minute setup</span>
                  </div>
                </div>

                {/* Metrics Banner */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex items-center space-x-4 max-w-lg">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-primary tracking-wider">Trusted Imperial Scale</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Managed 45,000+ ritual RSVPs across Udaipur, Jaipur, Goa, and New Delhi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Rich Interactive Wedding Folio Card */}
              <div className="lg:col-span-6 lg:pl-4">
                <div className="relative rounded-2xl bg-surface-container-lowest shadow-2xl p-6 sm:p-7 border border-outline-variant/40 overflow-hidden">
                  {/* Ambient Card Glow */}
                  <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-fixed-dim/20 blur-3xl pointer-events-none" />

                  {/* Folio Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/30">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs uppercase tracking-widest text-primary font-bold">
                        Imperial Folio Preview
                      </span>
                    </div>
                    <span className="text-xs font-serif italic text-on-surface-variant">Ananya & Rahul</span>
                  </div>

                  {/* Couple Image Banner */}
                  <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden shadow-sm mb-5 group">
                    <img
                      src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80"
                      alt="Indian Wedding Celebration"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[11px] font-bold tracking-widest uppercase mb-1">
                          Jaipur Royal Palace
                        </span>
                        <h3 className="font-serif text-2xl font-bold">Ananya & Rahul</h3>
                        <p className="text-xs text-stone-200">3 Days of Grand Celebrations • Dec 18-20</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-primary-fixed shadow">
                        <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                      </div>
                    </div>
                  </div>

                  {/* Live Muhurtham Countdown */}
                  <div className="bg-surface-container p-3.5 rounded-xl mb-4 shadow-sm border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                        Auspicious Muhurtham Countdown
                      </span>
                      <span className="inline-flex items-center space-x-1.5 text-xs text-secondary font-semibold">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                        <span>Live</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-surface-container-lowest rounded-lg py-2 shadow-sm border border-outline-variant/20">
                        <span className="font-serif text-xl font-bold text-primary block">{timeLeft.days}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium">Days</span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-lg py-2 shadow-sm border border-outline-variant/20">
                        <span className="font-serif text-xl font-bold text-primary block">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium">Hours</span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-lg py-2 shadow-sm border border-outline-variant/20">
                        <span className="font-serif text-xl font-bold text-primary block">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium">Mins</span>
                      </div>
                      <div className="bg-surface-container-lowest rounded-lg py-2 shadow-sm border border-outline-variant/20">
                        <span className="font-serif text-xl font-bold text-primary block">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmed RSVP Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-container-low rounded-lg mb-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <span className="font-semibold text-on-surface">342 Confirmed Guests</span>
                    </div>
                    <span className="text-on-surface-variant">4 Sacred Events Scheduled</span>
                  </div>

                  {/* Multi-Event Schedule Mini-Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/20">
                      <span className="text-[10px] text-primary font-bold uppercase block">Haldi Ceremony</span>
                      <span className="font-semibold text-on-surface block mt-0.5">10:00 AM • Poolside</span>
                      <span className="text-[11px] text-on-surface-variant">Dress: Sunshine Yellow</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/20">
                      <span className="text-[10px] text-primary font-bold uppercase block">Sangeet Night</span>
                      <span className="font-semibold text-on-surface block mt-0.5">07:00 PM • Navy Lawn</span>
                      <span className="text-[11px] text-on-surface-variant">Dress: Glimmer & Gold</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/20">
                      <span className="text-[10px] text-primary font-bold uppercase block">Pheras Mandap</span>
                      <span className="font-semibold text-on-surface block mt-0.5">11:00 AM • Courtyard</span>
                      <span className="text-[11px] text-on-surface-variant">Dress: Traditional Royal</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant/20">
                      <span className="text-[10px] text-primary font-bold uppercase block">Imperial Reception</span>
                      <span className="font-semibold text-on-surface block mt-0.5">08:00 PM • Grand Ballroom</span>
                      <span className="text-[11px] text-on-surface-variant">Dress: Black Tie / Regal</span>
                    </div>
                  </div>

                  {/* Fast-Track VIP QR Entry Pass */}
                  <div className="p-3 rounded-xl bg-surface-container-high flex items-center justify-between shadow-sm border border-outline-variant/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-white p-1 rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <QrCode className="w-full h-full text-on-surface" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                            Fast-Track Palace Pass
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                        </div>
                        <p className="text-xs font-semibold text-on-surface">Guest: Aarav Sharma</p>
                        <p className="text-[11px] text-on-surface-variant">Table 04 • Pure Veg Meal</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-white text-[10px] font-bold text-primary uppercase shadow-sm border border-primary-container/20">
                      VIP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 3. SACRED RITUALS RIBBON BANNER */}
        {/* ========================================================================= */}
        <section id="rituals" className="w-full bg-surface-container-low py-4 shadow-sm overflow-hidden border-y border-outline-variant/40">
          <style>{`
            @keyframes mmm-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            .mmm-marquee-track { display: flex; width: max-content; animation: mmm-marquee 28s linear infinite; }
            .mmm-marquee:hover .mmm-marquee-track, .mmm-marquee:active .mmm-marquee-track { animation-play-state: paused; }
            @media (prefers-reduced-motion: reduce) { .mmm-marquee-track { animation: none; } .mmm-marquee { overflow-x: auto; } }
          `}</style>
          <div className="mmm-marquee overflow-hidden" aria-label="Wedding ceremonies: Haldi, Mehendi, Sangeet, Baraat, Auspicious Pheras, Muhurtham, Reception Gala">
            <div className="mmm-marquee-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center shrink-0 gap-8 pr-8" aria-hidden={copy === 1}>
                  {[
                    { label: 'Haldi', clock: false },
                    { label: 'Mehendi', clock: false },
                    { label: 'Sangeet', clock: false },
                    { label: 'Baraat', clock: false },
                    { label: 'Auspicious Pheras', clock: false },
                    { label: 'Muhurtham', clock: true },
                    { label: 'Reception Gala', clock: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-8 shrink-0">
                      <div className="flex items-center space-x-2 shrink-0 whitespace-nowrap">
                        {item.clock ? <Clock className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
                        <span className="font-serif text-lg font-semibold text-primary">{item.label}</span>
                      </div>
                      <span className="text-outline-variant text-sm shrink-0">✦</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CORE FEATURES SECTION (BENTO GRID) */}
        {/* ========================================================================= */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest font-bold text-primary block mb-2">
              Effortless Elegance
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mb-3">
              Designed for Grand Multi-Day Celebrations
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant">
              Every high-touch ceremony requires distinct guest lists, customized dress codes, and effortless hospitality. We orchestrate it all with palace-grade sophistication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Multi-Event Orchestration</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Create independent itineraries for Haldi, Sangeet, Muhurtham, and Reception with customized guest access, distinct dress codes, Google Map directions, and curated host notes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>Tailored Event Privacy</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Royal Digital Invitations</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Deliver bespoke gold-foiled dynamic cards personalized with guest family names via encrypted WhatsApp and Email links in English, Hindi, and Telugu.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>WhatsApp & SMS Dispatch</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Real-Time RSVP & Plus-Ones</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Track confirmed guest counts per ritual. Capture vital catering preferences (Jain, Pure Vegetarian, Vegan, Halal) and airport shuttle pickup flight timings.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>Instant Headcount Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">VIP QR Check-in Desk</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Eliminate gate confusion and check-in queues at heritage venues. Concierge staff scan personalized passes via smartphone to display assigned room keys and banquet tables.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>Frictionless Palace Entry</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Live Guest Photo Vault</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Place branded table-tent QR codes throughout your venue. Guests snap and upload uncompressed raw candid photos straight into your private royal cloud gallery.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>Instant Real-Time Curation</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-surface-container-low rounded-2xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-outline-variant/30">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform border border-primary-container/20">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Global 4K Live Streaming</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Ensure grandparents, distant relatives, and diaspora friends participate in the sacred Pheras in real time through an ultra-low latency, password-protected live stream.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-primary text-xs font-semibold">
                <span>Worldwide Virtual Attendance</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. 3-STEP PROCESS SECTION */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="w-full bg-surface-container-low py-20 border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest font-bold text-primary block mb-2">
                Simple & Sovereign
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
                From Vision to Celebration in 3 Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/30 relative">
                <div className="font-serif text-4xl text-primary/20 font-bold mb-2">01</div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Create Your Workspace</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                  Define your dates, add multi-day rituals (Haldi, Baraat, Pheras), and select an imperial digital invitation theme inspired by royal Indian architecture.
                </p>
                <div className="flex items-center space-x-2 text-primary text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Choose Palace Theme</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/30 relative">
                <div className="font-serif text-4xl text-primary/20 font-bold mb-2">02</div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Invite Guests Seamlessly</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                  Import contacts with a tap. Automatically distribute royal monogram invites across WhatsApp and Email with unique personalized RSVP links.
                </p>
                <div className="flex items-center space-x-2 text-primary text-xs font-semibold">
                  <Mail className="w-4 h-4" />
                  <span>1-Click WhatsApp Dispatch</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/30 relative">
                <div className="font-serif text-4xl text-primary/20 font-bold mb-2">03</div>
                <h3 className="font-serif text-xl font-bold text-on-surface mb-2">Celebrate with Serenity</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                  Monitor real-time guest arrivals, pass dietary headcounts to catering chefs, and enjoy fast QR entry desks while receiving digital blessing notes.
                </p>
                <div className="flex items-center space-x-2 text-primary text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Zero Wedding Day Stress</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. INTERACTIVE THEME CUSTOMIZER & TESTIMONIAL */}
        {/* ========================================================================= */}
        <section id="preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Interactive Theme Customizer Preview */}
            <div className="lg:col-span-7 bg-surface-container-low p-6 sm:p-8 rounded-2xl shadow-md border border-outline-variant/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-outline-variant/30 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-primary font-bold">Live Experience Preview</span>
                  <h3 className="font-serif text-xl font-bold text-on-surface">Imperial Theme Customizer</h3>
                </div>

                {/* Theme Switcher Pills */}
                <div className="flex items-center space-x-1.5 p-1 bg-surface-container rounded-xl">
                  {(['gold', 'rose', 'ivory'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setActiveTheme(theme)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTheme === theme
                          ? 'bg-white text-primary shadow-sm border border-outline-variant/20'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {theme === 'gold' && 'Gold Foil'}
                      {theme === 'rose' && 'Royal Rose'}
                      {theme === 'ivory' && 'Silk Ivory'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Theme Card Preview */}
              <div className={`p-8 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.borderColor} shadow-sm transition-all duration-300`}>
                <div className="text-center max-w-md mx-auto">
                  {/* Monogram Seal */}
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${currentTheme.badgeBg} flex items-center justify-center shadow-inner font-serif text-xl font-bold`}>
                    {activeTheme === 'gold' ? 'A&R' : activeTheme === 'rose' ? 'M&K' : 'S&A'}
                  </div>

                  <span className={`text-[11px] uppercase tracking-widest font-bold ${currentTheme.accentColor} block mb-1`}>
                    {currentTheme.tagline}
                  </span>

                  <h4 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mb-2">
                    {currentTheme.names}
                  </h4>

                  <p className="text-xs text-on-surface-variant mb-6 italic">
                    Cordially invite you to celebrate their sacred union across 3 days of celebration in {currentTheme.venue}.
                  </p>

                  {/* Interactive RSVP Action */}
                  <div className="bg-surface-container/70 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-outline-variant/20">
                    <div className="text-left">
                      <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">
                        Will you attend?
                      </span>
                      <span className="text-xs font-semibold text-on-surface">Please RSVP by Nov 15</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setRsvpState('accepted')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                          rsvpState === 'accepted'
                            ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                            : 'bg-primary text-white hover:opacity-90'
                        }`}
                      >
                        {rsvpState === 'accepted' ? '✓ Accepted' : 'Joyfully Accept'}
                      </button>

                      <button
                        onClick={() => setRsvpState('declined')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          rsvpState === 'declined'
                            ? 'bg-stone-300 text-stone-800'
                            : 'bg-surface-container-highest text-on-surface hover:bg-stone-200'
                        }`}
                      >
                        {rsvpState === 'declined' ? 'Declined' : 'Regretfully Decline'}
                      </button>
                    </div>
                  </div>

                  {rsvpState !== 'none' && (
                    <p className="text-[11px] text-primary font-medium mt-3 animate-fade-in">
                      {rsvpState === 'accepted'
                        ? '🎉 Thank you! Your attendance and dietary preferences have been recorded.'
                        : 'We appreciate your warm wishes!'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Testimonial & Social Proof */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {/* Couple Photo Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg h-60 border border-outline-variant/30">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
                  alt="Priya and Vikram Malhotra"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center space-x-1 text-primary-fixed mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary-fixed" />
                    ))}
                  </div>
                  <p className="font-serif text-lg font-bold">Priya & Vikram Malhotra</p>
                  <p className="text-xs text-stone-200">Udaipur Destination Wedding • 520 Royal Guests</p>
                </div>
              </div>

              {/* Quote Box */}
              <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm border border-outline-variant/30">
                <span className="font-serif text-4xl text-primary/30 leading-none block -mb-2">“</span>
                <p className="text-sm text-on-surface-variant italic mb-4">
                  “With 500 guests flying in from London, Dubai, and Mumbai for our 4-day palace wedding, coordinating itineraries seemed daunting. MakeMyMarriage handled our WhatsApp invites, diet preferences, and VIP check-ins without a single glitch.”
                </p>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary">99.4% RSVP Completion Rate</span>
                  <span className="text-on-surface-variant">Udaipur Palace Event</span>
                </div>
              </div>

              {/* Rating Stats Strip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl text-center shadow-sm border border-outline-variant/30">
                  <span className="font-serif text-2xl font-bold text-primary block">4.9 / 5</span>
                  <span className="text-[11px] text-on-surface-variant uppercase font-medium">Rated by 850+ Couples</span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl text-center shadow-sm border border-outline-variant/30">
                  <span className="font-serif text-2xl font-bold text-primary block">100%</span>
                  <span className="text-[11px] text-on-surface-variant uppercase font-medium">WhatsApp Delivery Rate</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. HIGH-IMPACT WINE & GOLD CTA BANNER */}
        {/* ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative rounded-3xl bg-gradient-to-r from-secondary to-[#4c0519] p-8 sm:p-14 text-center text-white shadow-2xl overflow-hidden border border-secondary-container/30">
            {/* Ambient Decorative Circles */}
            <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-primary-container/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-primary-container/30 backdrop-blur-md flex items-center justify-center mb-5 shadow-inner text-primary-fixed border border-primary-fixed/20">
                <Heart className="w-7 h-7 fill-primary-fixed" />
              </div>

              <span className="text-xs uppercase tracking-widest text-primary-fixed block mb-2 font-bold">
                Commence Your Royal Chapter
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 leading-tight">
                Ready to Create Your Dream Wedding Experience?
              </h2>

              <p className="text-sm sm:text-base text-stone-200 mb-8 max-w-xl">
                Join hundreds of modern couples celebrating their big day stress-free. Free to start, no credit card required, instant WhatsApp preview.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {isAuthenticated ? (
                  <Link
                    to={dashboardUrl}
                    className="px-8 py-3.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm shadow-xl hover:bg-[#a67933] transition-all hover:scale-105 inline-flex items-center space-x-2"
                  >
                    <span>Open Royal Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    className="px-8 py-3.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm shadow-xl hover:bg-[#a67933] transition-all hover:scale-105"
                  >
                    Create Your Wedding — It's Free
                  </Link>
                )}
                <a
                  href="#preview"
                  className="px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm hover:bg-white/20 border border-white/20 transition-all"
                >
                  Schedule Concierge Walkthrough
                </a>
              </div>

              <div className="mt-8 flex items-center space-x-4 text-xs text-stone-300">
                <span>🔒 Bank-Grade RSVP Encryption</span>
                <span>•</span>
                <span>⚡ Live within 2 Minutes</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. LUXURY 5-COLUMN FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/40 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <Heart className="w-4 h-4 fill-primary" />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-on-surface">
                  MakeMy<span className="text-primary italic">Marriage</span>
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The premier digital ecosystem orchestrating multi-day luxury weddings, bespoke guest itineraries, and royal digital invitations worldwide.
              </p>
            </div>

            {/* Col 2: Product */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-primary font-bold">Product</h4>
              <div className="flex flex-col space-y-2 text-xs text-on-surface-variant">
                <a href="#features" className="hover:text-on-surface transition-colors">Royal RSVP Engine</a>
                <a href="#rituals" className="hover:text-on-surface transition-colors">Ceremony Timeline Rail</a>
                <a href="#features" className="hover:text-on-surface transition-colors">Gold Foil Digital Cards</a>
                <a href="#preview" className="hover:text-on-surface transition-colors">Palace Themes</a>
              </div>
            </div>

            {/* Col 3: Experience */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-primary font-bold">Experience</h4>
              <div className="flex flex-col space-y-2 text-xs text-on-surface-variant">
                <a href="#preview" className="hover:text-on-surface transition-colors">Interactive Live Demo</a>
                <a href="#features" className="hover:text-on-surface transition-colors">Guest Flight Concierge</a>
                <a href="#features" className="hover:text-on-surface transition-colors">Dietary Preferences</a>
                <Link to="/signup" className="hover:text-on-surface transition-colors">Bespoke Curations</Link>
              </div>
            </div>

            {/* Col 4: Resources */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-primary font-bold">Resources</h4>
              <div className="flex flex-col space-y-2 text-xs text-on-surface-variant">
                <span className="hover:text-on-surface cursor-pointer transition-colors">Heritage Venues</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Bridal Etiquette Guide</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Family Coordination</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Concierge Support</span>
              </div>
            </div>

            {/* Col 5: Languages & Legal */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-primary font-bold">Languages & Legal</h4>
              <div className="flex flex-col space-y-2 text-xs text-on-surface-variant">
                <span className="text-on-surface font-semibold">English • हिन्दी • తెలుగు</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Privacy Policy</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Terms of Service</span>
                <span className="hover:text-on-surface cursor-pointer transition-colors">Security Standards</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>© 2026 MakeMyMarriage. Crafted with love for modern weddings.</p>
            <p className="text-[11px] text-outline uppercase tracking-wider">Royal Heritage • Digital Elegance</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
