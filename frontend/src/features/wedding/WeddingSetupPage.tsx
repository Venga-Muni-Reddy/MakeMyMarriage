import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Palette,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
  Users,
  Zap,
  Edit3,
  Bookmark,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { weddingService } from '../../services/wedding.service';

export const WeddingSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createWedding } = useWedding();

  // Form State
  const [partner1Name, setPartner1Name] = useState('Meera Kapoor');
  const [partner2Name, setPartner2Name] = useState('Aarav Singhania');
  const [customTitle, setCustomTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [muhurthamDate, setMuhurthamDate] = useState('2026-11-28');
  const [displayDate, setDisplayDate] = useState('Saturday, November 28, 2026');
  const [venueName, setVenueName] = useState('The Leela Palace, Udaipur');
  const [isMultiDay, setIsMultiDay] = useState(true);

  const [slug, setSlug] = useState('meera-aarav-2026');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; message: string }>({
    available: true,
    message: 'Domain Available & Reserved — Encrypted RSVP protocols primed.',
  });

  const [themePalette, setThemePalette] = useState<'gold' | 'rose' | 'amber'>('gold');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived Values
  const computedTitle =
    customTitle ||
    `The Royal Union of ${partner1Name.trim() || 'Bride'} & ${partner2Name.trim() || 'Groom'}`;

  const getMonogram = () => {
    const init1 = partner1Name.trim().charAt(0).toUpperCase() || 'M';
    const init2 = partner2Name.trim().charAt(0).toUpperCase() || 'A';
    return `${init1} & ${init2}`;
  };

  // Auto-generate slug when names change if slug was not manually heavily modified
  const handlePartner1Change = (val: string) => {
    setPartner1Name(val);
    const p1 = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const p2 = partner2Name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (p1 && p2) setSlug(`${p1}-${p2}-2026`);
  };

  const handlePartner2Change = (val: string) => {
    setPartner2Name(val);
    const p1 = partner1Name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const p2 = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (p1 && p2) setSlug(`${p1}-${p2}-2026`);
  };

  // Slug check debouncer
  const verifySlug = async (candidateSlug: string) => {
    if (!candidateSlug || candidateSlug.length < 3) {
      setSlugStatus({ available: false, message: 'Slug must be at least 3 characters' });
      return;
    }
    setIsCheckingSlug(true);
    try {
      const res = await weddingService.checkSlug(candidateSlug);
      setSlugStatus({
        available: res.available,
        message: res.available
          ? 'Domain Available & Reserved — Encrypted RSVP protocols primed.'
          : 'Handle is already reserved. Please choose an alternate handle.',
      });
    } catch {
      setSlugStatus({ available: true, message: 'Handle ready to be reserved.' });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner1Name.trim() || !partner2Name.trim()) {
      setError('Please provide names for both partners.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createWedding({
        partner1Name: partner1Name.trim(),
        partner2Name: partner2Name.trim(),
        title: computedTitle,
        slug: slug.trim().toLowerCase(),
        startDate: muhurthamDate,
        endDate: isMultiDay ? '2026-11-29' : muhurthamDate,
        primaryVenueName: venueName.trim(),
        primaryCity: 'Udaipur, Rajasthan',
        themePalette,
        settings: {
          isMultiDay,
          displayDate,
          themePalette,
        },
      });

      // Redirect to the dynamic dashboard upon creation
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Logo & Brand Title */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
              <Heart className="w-4 h-4 fill-primary text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-on-surface leading-tight">
                MakeMy<span className="text-primary italic">Marriage</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Royal Folio Concierge
              </span>
            </div>
          </Link>

          {/* Stepper Navigation Pills (Desktop) */}
          <nav className="hidden lg:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-sm text-xs font-semibold">
            <span className="px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 bg-primary text-on-primary shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse"></span>
              Step 1: The Couple
            </span>
            <span className="px-3 py-1 rounded-full uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              Step 2: Sacred Dates
            </span>
            <span className="px-3 py-1 rounded-full uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              Step 3: Folio URL
            </span>
            <span className="px-3 py-1 rounded-full uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              Step 4: Royal Theme
            </span>
          </nav>

          {/* Exit Link & User Profile Badge */}
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-xs uppercase tracking-wider font-semibold text-secondary hover:text-on-surface transition-colors"
            >
              Exit to Dashboard
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/40">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface leading-tight">
                  {user?.name || 'Royal Host'}
                </span>
                <span className="text-[10px] text-on-surface-variant">Workspace Creator</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WIZARD STUDIO LAYOUT */}
      {/* ========================================================================= */}
      <main className="w-full pt-20 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Top Breadcrumb & Status Ribbon */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-bold uppercase tracking-widest text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Royal Workspace Initiation
            </span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Folio Configuration Studio</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-medium text-on-surface">Auto-Saving Enabled</span>
            <span className="text-outline-variant">•</span>
            <span className="font-mono text-[11px]">Folio ID: #MM-UDR-2026</span>
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Split Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================================= */}
          {/* LEFT COLUMN: Interactive Guided Studio (7 of 12 cols = ~60%) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Header Lead */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-surface-container text-primary text-xs uppercase font-bold tracking-widest">
                <span>👑 Step 1 of 4</span>
                <span className="text-outline-variant">•</span>
                <span>Concierge Folio Genesis</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-on-surface font-bold tracking-tight">
                Inaugurate Your <span className="italic text-primary">Royal Wedding</span> Folio
              </h1>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Establish your digital royal enclave for your sacred ceremonies, honored kin, and auspicious celebrations with bespoke Rajputana precision.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* SECTION 1: THE COUPLE & CEREMONIAL TITLE */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                      <Heart className="w-4 h-4 fill-primary text-primary" />
                    </div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-on-surface">
                        The Couple & Ceremonial Title
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Honored protagonists of the royal nuptials
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-primary px-2.5 py-0.5 rounded bg-primary-fixed/40">
                    Required
                  </span>
                </div>

                {/* Partner Dual Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                      Bride / Partner 1
                    </label>
                    <input
                      type="text"
                      value={partner1Name}
                      onChange={(e) => handlePartner1Change(e.target.value)}
                      placeholder="e.g. Meera Kapoor"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                      Groom / Partner 2
                    </label>
                    <input
                      type="text"
                      value={partner2Name}
                      onChange={(e) => handlePartner2Change(e.target.value)}
                      placeholder="e.g. Aarav Singhania"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                    />
                  </div>
                </div>

                {/* Ceremonial Title Suggestion Box */}
                <div className="bg-surface-container p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-outline-variant/30">
                  <div className="space-y-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-bold tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Formal Inscription
                      </span>
                    </div>

                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={customTitle || computedTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-serif font-bold text-primary bg-surface-container-lowest border border-primary/40 rounded-lg focus:outline-none"
                      />
                    ) : (
                      <div className="font-serif text-base font-bold text-primary">
                        {computedTitle}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(!isEditingTitle)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-xs uppercase font-bold tracking-wider hover:bg-surface transition-colors shadow-sm border border-outline-variant/40"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditingTitle ? 'Done' : 'Edit Inscription'}
                  </button>
                </div>
              </div>

              {/* SECTION 2: AUSPICIOUS TIMING & DESTINATION */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-on-surface">
                        Auspicious Muhurtham & Destination
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Vedic astral dates and majestic venues
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold tracking-wider uppercase">
                    Vedic Certified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                        Auspicious Muhurtham Date
                      </label>
                      <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                        Shubh Muhurtham
                      </span>
                    </div>
                    <input
                      type="date"
                      value={muhurthamDate}
                      onChange={(e) => {
                        setMuhurthamDate(e.target.value);
                        if (e.target.value) {
                          const d = new Date(e.target.value);
                          setDisplayDate(
                            d.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          );
                        }
                      }}
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                      Palace / Destination Venue
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g. The Leela Palace, Udaipur"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all"
                    />
                  </div>
                </div>

                {/* Multi-Day Festivities Toggle */}
                <div className="p-3.5 bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-container text-primary">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-on-surface block">
                        Multi-Day Festivities Schedule
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Nov 26 – Nov 29, 2026 (4 Ceremonial Days: Haldi to Grand Reception)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMultiDay(!isMultiDay)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                      isMultiDay ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                        isMultiDay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SECTION 3: DIGITAL FOLIO WEB ADDRESS (SLUG) */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-on-surface">
                        Digital Folio Web Address
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        The private regal hyperlink shared with your royal guest list
                      </p>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-outline-variant" />
                </div>

                {/* Custom URL Builder */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                    Guest Portal Custom Handle
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap items-center rounded-xl bg-surface-container-low border border-outline-variant/40 p-1.5 focus-within:bg-surface-container-lowest focus-within:border-primary transition-all">
                    <span className="px-3 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-mono select-none">
                      makemymarriage.com/w/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                      placeholder="custom-wedding-slug"
                      required
                      className="flex-1 px-3 py-2 bg-transparent text-primary text-sm font-bold tracking-wide focus:outline-none min-w-[140px]"
                    />
                    <button
                      type="button"
                      onClick={() => verifySlug(slug)}
                      disabled={isCheckingSlug}
                      className="px-3 py-2 rounded-lg bg-surface-container text-primary text-xs uppercase font-bold tracking-wider hover:bg-primary-fixed transition-colors disabled:opacity-50"
                    >
                      {isCheckingSlug ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Verification Alert Chip */}
                <div
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${
                    slugStatus.available
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  {slugStatus.available ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span className="font-medium">{slugStatus.message}</span>
                </div>
              </div>

              {/* SECTION 4: SIGNATURE THEME PALETTE SELECTOR */}
              <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                    <Palette className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-on-surface">
                      Signature Theme Palette
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Select the visual atmosphere for your guest folio & ceremonial cards.
                    </p>
                  </div>
                </div>

                {/* 3 Tactile Radio Swatch Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Option 1: Gold */}
                  <label
                    onClick={() => setThemePalette('gold')}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                      themePalette === 'gold'
                        ? 'bg-surface-container border-primary shadow-sm ring-1 ring-primary'
                        : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-on-surface">Imperial Gold</span>
                      {themePalette === 'gold' && (
                        <span className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-amber-300 shadow-inner"></span>
                      <span className="w-5 h-5 rounded-full bg-[#D4AF37]"></span>
                      <span className="w-5 h-5 rounded-full bg-[#7F560C]"></span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant leading-tight block">
                      Champagne silk, 24k gold foil, polished ivory paper
                    </span>
                    <span className="absolute -top-2 right-2 bg-primary text-on-primary text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Recommended
                    </span>
                  </label>

                  {/* Option 2: Rose */}
                  <label
                    onClick={() => setThemePalette('rose')}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                      themePalette === 'rose'
                        ? 'bg-surface-container border-secondary shadow-sm ring-1 ring-secondary'
                        : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-on-surface">Royal Rose & Wine</span>
                      {themePalette === 'rose' && (
                        <span className="w-4 h-4 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#9F1239]"></span>
                      <span className="w-5 h-5 rounded-full bg-[#FFD9DC]"></span>
                      <span className="w-5 h-5 rounded-full bg-[#D4AF37]"></span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant leading-tight block">
                      Deep burgundy velvet, blush rosewater, gilded accents
                    </span>
                  </label>

                  {/* Option 3: Amber */}
                  <label
                    onClick={() => setThemePalette('amber')}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                      themePalette === 'amber'
                        ? 'bg-surface-container border-amber-600 shadow-sm ring-1 ring-amber-600'
                        : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-on-surface">Vedic Marigold</span>
                      {themePalette === 'amber' && (
                        <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-5 h-5 rounded-full bg-[#D97706]"></span>
                      <span className="w-5 h-5 rounded-full bg-[#FDE68A]"></span>
                      <span className="w-5 h-5 rounded-full bg-[#92400E]"></span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant leading-tight block">
                      Sacred haldi saffron, sunset amber, auspicious vermilion
                    </span>
                  </label>
                </div>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="pt-2 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 shadow-sm">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-container text-on-surface-variant text-xs uppercase tracking-wider font-bold hover:bg-surface-container-high transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-secondary text-on-secondary text-xs uppercase tracking-widest font-bold shadow-lg hover:bg-secondary/90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Inaugurating Workspace...</span>
                    ) : (
                      <>
                        <span>Create Royal Workspace & Launch Suite</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Micro-Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-on-surface-variant text-[11px] uppercase tracking-wider py-1 font-semibold">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    256-Bit Sovereign Workspace
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Co-Host & Planner Invites Primed
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Instant Cloud Sync
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN: Live Interactive Digital Folio Preview Card (5 of 12 = ~40%) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col gap-4">
            {/* Live Indicator Pill */}
            <div className="flex items-center justify-between bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span className="text-xs uppercase font-bold tracking-widest text-on-surface">
                  Live Folio Preview
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {themePalette === 'gold'
                    ? 'Gold Foil Rendering'
                    : themePalette === 'rose'
                    ? 'Rose Velvet Rendering'
                    : 'Amber Saffron Rendering'}
                </span>
              </div>
            </div>

            {/* FLOATING 3D INVITATION CARD */}
            <div className="relative w-full rounded-2xl bg-surface-container-lowest p-4 sm:p-5 border border-outline-variant/40 shadow-xl transition-transform duration-500 hover:-translate-y-1">
              {/* Inner Card Frame */}
              <div className="relative w-full rounded-xl bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F7F2E9] p-6 text-center flex flex-col items-center justify-between min-h-[540px] border border-amber-200/50 shadow-sm overflow-hidden">
                {/* 4 Corner Filigree Flourish SVGs */}
                <div className="absolute top-2 left-2 text-[#D4AF37] opacity-40">
                  <svg fill="currentColor" height="32" viewBox="0 0 40 40" width="32">
                    <path d="M0,0 Q18,0 20,20 Q20,2 40,0 L40,6 Q24,8 22,22 Q8,24 6,40 L0,40 Z"></path>
                  </svg>
                </div>
                <div className="absolute top-2 right-2 text-[#D4AF37] opacity-40 rotate-90">
                  <svg fill="currentColor" height="32" viewBox="0 0 40 40" width="32">
                    <path d="M0,0 Q18,0 20,20 Q20,2 40,0 L40,6 Q24,8 22,22 Q8,24 6,40 L0,40 Z"></path>
                  </svg>
                </div>
                <div className="absolute bottom-2 left-2 text-[#D4AF37] opacity-40 -rotate-90">
                  <svg fill="currentColor" height="32" viewBox="0 0 40 40" width="32">
                    <path d="M0,0 Q18,0 20,20 Q20,2 40,0 L40,6 Q24,8 22,22 Q8,24 6,40 L0,40 Z"></path>
                  </svg>
                </div>
                <div className="absolute bottom-2 right-2 text-[#D4AF37] opacity-40 rotate-180">
                  <svg fill="currentColor" height="32" viewBox="0 0 40 40" width="32">
                    <path d="M0,0 Q18,0 20,20 Q20,2 40,0 L40,6 Q24,8 22,22 Q8,24 6,40 L0,40 Z"></path>
                  </svg>
                </div>

                {/* Top Monogram Seal */}
                <div className="w-full flex flex-col items-center pt-1 space-y-2 z-10">
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#7F560C] to-[#D4AF37] p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[#FFF8F5] flex items-center justify-center shadow-inner">
                      <span className="font-serif text-sm font-bold text-primary tracking-tighter">
                        {getMonogram()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-primary text-on-primary text-[8px] uppercase tracking-widest font-bold">
                      Kalyanam
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant block font-semibold">
                      Under the Auspices of the Royal Families
                    </span>
                    <p className="font-serif text-xs italic text-on-surface-variant font-normal mt-0.5">
                      cordially invite you to celebrate the sacred union of
                    </p>
                  </div>
                </div>

                {/* Couple Names (Hero Serif) */}
                <div className="my-3 py-1 z-10 w-full">
                  <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-primary leading-tight">
                    <div>{partner1Name.trim() || 'Bride'}</div>
                    <div className="text-base italic font-normal text-on-surface-variant my-0.5">
                      &
                    </div>
                    <div>{partner2Name.trim() || 'Groom'}</div>
                  </div>
                  <div className="inline-block mt-2 px-3 py-0.5 bg-surface-container rounded-full text-on-surface-variant text-[10px] uppercase tracking-widest font-semibold border border-outline-variant/30">
                    The Royal Wedding Folio
                  </div>
                </div>

                {/* Palace Venue Thumbnail */}
                <div className="w-full max-w-xs rounded-xl overflow-hidden shadow-sm relative group z-10 border border-outline-variant/40">
                  <div className="h-28 w-full overflow-hidden relative">
                    <img
                      className="w-full h-full object-cover"
                      alt="The Leela Palace Udaipur"
                      src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-[11px] font-semibold flex items-center gap-1 drop-shadow">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />
                        <span>{venueName}</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white uppercase font-bold tracking-wider">
                        Main Mandap
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auspicious Muhurtham Date */}
                <div className="w-full pt-3 space-y-2 z-10">
                  <div className="flex items-center justify-center gap-1.5 text-on-surface">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-serif text-sm font-bold tracking-wide">
                      {displayDate}
                    </span>
                  </div>

                  {/* Ceremonial Ritual Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs mx-auto">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface font-medium border border-outline-variant/30">
                      ☀️ Sacred Haldi
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface font-medium border border-outline-variant/30">
                      💃 Sangeet Night
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface font-medium border border-outline-variant/30">
                      🔥 Vedic Pheras
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-on-surface font-medium border border-outline-variant/30">
                      🥂 Royal Reception
                    </span>
                  </div>

                  {/* Handle Link Badge */}
                  <div className="pt-1">
                    <span className="font-mono text-[11px] text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full border border-primary/20 inline-block font-semibold">
                      makemymarriage.com/w/{slug}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
