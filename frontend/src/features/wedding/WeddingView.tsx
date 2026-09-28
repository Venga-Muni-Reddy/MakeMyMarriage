import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Users,
  Send,
  UtensilsCrossed,
  Camera,
  QrCode,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  Check,
  Share2,
  PlusCircle,
  Flame,
  Radio,
  Printer,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const WeddingView: React.FC = () => {
  // 1. Live Countdown State
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 12,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.origin + '/w/ananya-rahul');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. TOP BANNER & MUHURTHAM REAL-TIME COUNTDOWN STRIP */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-6 sm:p-8 flex flex-col xl:flex-row items-center justify-between gap-6">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-secondary-fixed/25 blur-2xl pointer-events-none" />

        {/* Greeting & Couple Context */}
        <div className="relative z-10 flex items-center space-x-4 w-full xl:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-inner shrink-0 border border-primary-container/30">
            <Sparkles className="w-7 h-7 fill-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                Shubh Vivah Conclave
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="text-xs text-secondary font-semibold">Auspicious Day</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
              Namaste Radhika, Maharani Suite
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Royal Wedding Concierge orchestration for <strong className="text-on-surface">Ananya & Rahul</strong> • City Palace, Udaipur
            </p>
          </div>
        </div>

        {/* Live Dynamic Muhurtham Bar & Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Countdown Pill */}
          <div className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/40 shadow-xs">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Lagna Muhurtham In
            </span>
            <div className="flex items-center space-x-1 font-serif text-sm sm:text-base font-bold text-primary pl-1">
              <span>{timeLeft.days}</span>
              <span className="text-[10px] font-sans text-on-surface-variant font-normal">D</span> :
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] font-sans text-on-surface-variant font-normal">H</span> :
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] font-sans text-on-surface-variant font-normal">M</span> :
              <span className="text-secondary">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] font-sans text-secondary font-normal">S</span>
            </div>
          </div>

          {/* Quick Share Link */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-primary" />}
            <span>{copied ? 'Link Copied!' : '/w/ananya-rahul'}</span>
          </button>

          {/* Add Ceremony CTA */}
          <Link
            to="/dashboard/events"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#881337] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Ceremony / VIP</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. IMPERIAL KPI METRIC RAIL (4 LUXURY CARDS) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: RSVP Confirmation */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Guest Attendance
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">342</span>
                <span className="text-sm text-on-surface-variant font-medium">/ 450</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary border border-primary-container/20">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-primary">76% Confirmed</span>
              <span className="text-secondary font-medium">108 Pending</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '76%' }} />
              <div className="h-full bg-secondary-fixed" style={{ width: '7%' }} />
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2 pt-1 border-t border-outline-variant/20">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>312 Attending</span>
              </span>
              <span>30 Declined</span>
            </div>
          </div>
        </div>

        {/* KPI 2: WhatsApp Invites Dispatched */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                WhatsApp Digital Foil
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">418</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Dispatched</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary border border-secondary/20">
              <Send className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center space-x-2 p-2 rounded-xl bg-surface-container text-xs font-medium text-primary mb-2 border border-outline-variant/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>99.8% Delivered Seamlessly</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Last open: 2 mins ago</span>
              <span className="font-semibold text-secondary">32 opened past 1h</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Catering & Diet Preferences */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Royal Banquet Menus
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">342</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Meals Logged</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary border border-primary-container/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/30">
              78 Jain Satvik
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed text-xs font-bold">
              184 Pure Veg
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-secondary-fixed text-secondary text-xs font-semibold">
              80 Non-Veg / Halal
            </span>
          </div>
        </div>

        {/* KPI 4: Live Photo Stream */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Guest Photo Stream
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">248</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Candid Snaps</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=120&q=80"
                alt="Guest Portrait"
                className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=120&q=80"
                alt="Groom Portrait"
                className="w-8 h-8 rounded-full ring-2 ring-white object-cover"
              />
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                +83
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Table QR Active
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN 2-COLUMN LUXURY SPLIT: CEREMONY ITINERARY & LIVE CONCIERGE HUB */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: ROYAL CEREMONY SCHEDULE & MULTI-DAY ITINERARY (7 COLS) */}
        {/* ------------------------------------------------------------- */}
        <div className="xl:col-span-7 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block">
                Muhurtham & Celebrations
              </span>
              <h2 className="font-serif text-2xl font-bold text-on-surface">
                Imperial Multi-Day Itinerary
              </h2>
            </div>
            <Link
              to="/dashboard/events"
              className="flex items-center space-x-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Manage All 4 Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Event 1: Haldi Rasam */}
          <article className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 hover:border-primary-container transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex flex-col items-center justify-center shrink-0 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold leading-none">Dec</span>
                  <span className="font-serif text-lg font-bold leading-none mt-0.5">18</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xs font-medium text-tertiary">
                    <span>10:00 AM — 01:30 PM</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">Poolside Courtyard</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-on-surface mt-0.5">
                    Haldi Rasam & Floral Phoolon Ki Holi
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Vibrant yellow marigold immersion, traditional Rajasthani folk dhol, and sit-down sitar brunch.
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
                  120 Confirmed
                </span>
                <p className="text-[11px] text-tertiary font-medium mt-1">Dress: Sunshine Yellow</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Guest List (120)
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Courtyard Layout
                </span>
              </div>
              <button className="text-secondary text-xs font-bold flex items-center space-x-1 hover:underline">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send Broadcast WhatsApp</span>
              </button>
            </div>
          </article>

          {/* Event 2: Royal Sangeet Gala */}
          <article className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 hover:border-primary-container transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex flex-col items-center justify-center shrink-0 border border-secondary/20">
                  <span className="text-[10px] uppercase font-bold leading-none">Dec</span>
                  <span className="font-serif text-lg font-bold leading-none mt-0.5">18</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xs font-medium text-secondary">
                    <span>07:00 PM — Midnight</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">Grand Manek Chowk Palace Lawns</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-on-surface mt-0.5">
                    Royal Sangeet Gala & Starlight Performances
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Choreographed royal family showdown, celebrity DJ, artisanal mixology, and gilded royal banquet.
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
                  350 Confirmed
                </span>
                <p className="text-[11px] text-secondary font-medium mt-1">Dress: Royal Gold & Jewel Tones</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Guest List (350)
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Stage Program (14 Acts)
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Sound & Lighting Cleared</span>
              </span>
            </div>
          </article>

          {/* Event 3: Auspicious Pheras & Muhurtham (CROWN CEREMONY) */}
          <article className="relative rounded-3xl bg-surface-container-lowest p-6 shadow-md border-2 border-primary-container/40">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-secondary text-white text-[10px] uppercase font-bold tracking-widest rounded-full shadow-sm flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Crown Ceremony</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <span className="text-[10px] uppercase font-bold leading-none">Dec</span>
                  <span className="font-serif text-lg font-bold leading-none mt-0.5">19</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-secondary">
                    <span>11:30 AM — 03:00 PM</span>
                    <span>•</span>
                    <span className="text-primary">Sunset Mandapam Pavilion (Lakefront)</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-on-surface mt-0.5">
                    Vedic Pheras & Sacred Muhurtham
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Baraat arrival via Lake Pichola vintage boats, 7 sacred vows, and shower of rose petals.
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed">
                  450 Confirmed
                </span>
                <p className="text-[11px] text-primary font-medium mt-1">Dress: Royal Ivory & Rose</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Mandap Seating Plan
                </span>
                <span className="px-3 py-1 rounded-lg bg-secondary text-white text-xs font-semibold flex items-center space-x-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Global 4K Live Stream</span>
                </span>
              </div>
              <span className="text-xs text-primary font-medium">Pandit Ji Samagri: Ready</span>
            </div>
          </article>

          {/* Event 4: Imperial Reception */}
          <article className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 hover:border-primary-container transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface flex flex-col items-center justify-center shrink-0 border border-outline-variant/30">
                  <span className="text-[10px] uppercase font-bold leading-none">Dec</span>
                  <span className="font-serif text-lg font-bold leading-none mt-0.5">20</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xs font-medium text-tertiary">
                    <span>08:00 PM — Late</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">Grand Darbar Hall & Terraces</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-on-surface mt-0.5">
                    Imperial Royal Reception & Gala Banquet
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Black-tie champagne toasts, string quartet orchestra, royal culinary display, and formal couple greeting.
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
                  500 Invited
                </span>
                <p className="text-[11px] text-on-surface-variant font-medium mt-1">Dress: Royal Black Tie</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  Banquet Table Matrix
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                  VIP Protocol
                </span>
              </div>
              <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">
                Seating Auto-Assign →
              </span>
            </div>
          </article>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: ACTION CENTER, GATE CHECK-IN, REAL-TIME ACTIVITY (5 COLS) */}
        {/* ------------------------------------------------------------- */}
        <div className="xl:col-span-5 space-y-6">
          {/* Quick Dispatch Action Center */}
          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-secondary" />
                <h3 className="font-serif text-lg font-bold text-on-surface">
                  Royal Concierge Dispatch
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Automated</span>
            </div>

            <div className="space-y-3">
              {/* Action 1 */}
              <div className="p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between cursor-pointer group border border-outline-variant/20">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                      1-Click WhatsApp Broadcast
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">Send pending RSVP nudge to 32 family elders</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Action 2 */}
              <Link
                to="/dashboard/checkin"
                className="p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between cursor-pointer group border border-outline-variant/20 block"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-xs group-hover:scale-105 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">
                      Fast-Track Gate Concierge
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">Open staff camera scanner for archway check-in</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Action 3 */}
              <div className="p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between cursor-pointer group border border-outline-variant/20">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                      Generate Table-Tent QR Codes
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">Download high-res PDF printables for 45 banquet tables</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Day-of Palace Gate Check-in Radial Progress Gauge */}
          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                  Live Palace Gate
                </span>
                <h3 className="font-serif text-lg font-bold text-on-surface">Arrival & Turnstile Log</h3>
              </div>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>Live Gate 01</span>
              </span>
            </div>

            <div className="flex items-center space-x-6 p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
              {/* Circular SVG Gauge */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container-highest"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-secondary"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="251.2"
                    strokeDashoffset="118"
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-serif text-lg font-bold text-on-surface block leading-none">53%</span>
                  <span className="text-[9px] uppercase text-on-surface-variant font-bold">Arrived</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-serif text-2xl font-bold text-on-surface">186</span>
                  <span className="text-xs text-on-surface-variant">/ 350 Guests</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Scanned at Badi Pol & Tripoliya Gateways for Sangeet evening.
                </p>
                <div className="flex items-center space-x-3 mt-1.5 text-[10px] font-semibold">
                  <span className="text-primary">VIP Passages: 48</span>
                  <span className="text-on-surface-variant">Suites Assigned: 64</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <span>Fastest check-in average: <strong className="text-on-surface">14 secs</strong></span>
              <Link to="/dashboard/checkin" className="text-secondary font-bold hover:underline">
                View Gate Cameras →
              </Link>
            </div>
          </div>

          {/* Real-time Blessings & Activity Feed */}
          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-serif text-lg font-bold text-on-surface">
                  Live Blessing & Activity Feed
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant">Updated real-time</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-on-surface">
                    <strong>Vikram & Sunita Singhania</strong> joyfully confirmed attendance for Haldi & Sangeet.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Table 04 • 2 Jain Meals • 2 mins ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-on-surface">
                    <strong>Aarav Sharma</strong> uploaded 4 candid snaps to the Lakeview Pavilion Photo Vault.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Verified Guest • 12 mins ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-on-surface">
                    <strong>Pooja Hegde & Family</strong> opened the personalized Royal Foil Invite link.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Via WhatsApp Broadcast • 24 mins ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <p className="text-on-surface">
                    <strong>Kabir Mehta</strong> left a blessing note: <em>“May your union be filled with palace grace!”</em>
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">+1 Guest Confirmed • 45 mins ago</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/20 text-center">
              <Link to="/dashboard/guests" className="text-xs font-bold text-primary hover:underline">
                View All 142 Guest Interactions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
