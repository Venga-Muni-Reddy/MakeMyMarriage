import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Send,
  Camera,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  Share2,
  PlusCircle,
  Calendar,
  MapPin,
  Crown,
  Tv
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { eventService, WeddingEvent } from '../../services/event.service';
import { guestService, RoyalGuest } from '../../services/guest.service';
import { invitationService } from '../../services/invitation.service';
import { mediaService } from '../../services/media.service';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const WeddingView: React.FC = () => {
  const { user } = useAuth();
  const { currentWedding } = useWedding();

  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [guests, setGuests] = useState<RoyalGuest[]>([]);
  const [invitationsCount, setInvitationsCount] = useState<number>(0);
  const [photosCount, setPhotosCount] = useState<number>(0);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate countdown to weddingDate or default 30 days
  useEffect(() => {
    if (!currentWedding?.weddingDate && !currentWedding?.settings?.displayDate) {
      setTimeLeft({ days: 30, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const targetDate = currentWedding.weddingDate
      ? new Date(currentWedding.weddingDate).getTime()
      : Date.now() + 30 * 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentWedding]);

  // Load actual dynamic data from database for current wedding
  useEffect(() => {
    if (!currentWedding?.id) {
      setEvents([]);
      setGuests([]);
      setInvitationsCount(0);
      setPhotosCount(0);
      return;
    }

    const loadMetrics = async () => {
      try {
        const [eventsData, guestsData] = await Promise.allSettled([
          eventService.getEvents(currentWedding.id),
          guestService.getGuests(currentWedding.id),
        ]);

        if (eventsData.status === 'fulfilled') {
          setEvents(eventsData.value || []);
        }
        if (guestsData.status === 'fulfilled') {
          const raw: any = guestsData.value;
          const guestItems = raw?.guests || (Array.isArray(raw) ? raw : []);
          setGuests(guestItems);
        }

        // Try loading invitations count
        try {
          const invs = await invitationService.getInvitations(currentWedding.id);
          setInvitationsCount(invs?.length || 0);
        } catch {
          setInvitationsCount(0);
        }

        // Try loading photos count
        try {
          const photos = await mediaService.getPhotos(currentWedding.id);
          setPhotosCount(photos?.length || 0);
        } catch {
          setPhotosCount(0);
        }
      } catch (err) {
        console.error('Error loading wedding metrics:', err);
      }
    };

    loadMetrics();
  }, [currentWedding?.id]);

  const handleCopy = () => {
    if (!currentWedding?.slug) return;
    navigator.clipboard?.writeText(window.location.origin + `/w/${currentWedding.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================================================================
  // ZERO STATE: User has NO weddings yet
  // =========================================================================
  if (!currentWedding) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-container-lowest border border-outline-variant/40 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0">
                <Crown className="w-8 h-8 fill-primary" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-widest text-primary block">
                  Welcome to MakeMyMarriage
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                  Namaste, {user?.name || 'Wedding Host'}!
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">
                  Your luxury digital wedding orchestration platform.
                </p>
              </div>
            </div>

            <Link
              to="/setup-wedding"
              className="px-6 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all flex items-center space-x-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inaugurate Royal Wedding</span>
            </Link>
          </div>
        </section>

        {/* Empty State Action Card */}
        <section className="p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border-2 border-dashed border-primary/30 text-center flex flex-col items-center justify-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary mb-2 shadow-inner">
            <Sparkles className="w-10 h-10 fill-primary" />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="font-serif text-2xl font-bold text-on-surface">
              No Active Wedding Workspace
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              You haven't created a wedding workspace yet. Establish your wedding to customize ceremony itineraries, dispatch digital invitations, track RSVPs, and stream live to your relatives worldwide.
            </p>
          </div>

          <Link
            to="/setup-wedding"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-amber-700 hover:from-primary/90 hover:to-amber-800 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 transition-all flex items-center space-x-2"
          >
            <span>Inaugurate Your Wedding Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* What You Can Do (Feature Highlights) */}
        <section className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-on-surface px-1">
            What You Can Orchestrate in Version 1.0:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-on-surface">
                1. Sacred Ceremonies
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Add Haldi, Mehndi, Sangeet, Muhurtham & Reception with multi-day itineraries and venue maps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-on-surface">
                2. Guest Registry & RSVP
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Manage guest households, dietary preferences (Jain Satvik, Pure Veg), and zero-account RSVP submissions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-on-surface">
                3. Digital WhatsApp Passes
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Personalized royal invite cards with unique QR magic pass tokens for seamless gate check-in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-base text-on-surface">
                4. Live Mandap & Photo Vault
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Stream sacred pheras in 4K with falling rose petals and crowdsource guest photos with table QR codes.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE WEDDING STATE: User has created a wedding
  // =========================================================================
  const partner1 = currentWedding.settings?.partner1Name || 'Partner 1';
  const partner2 = currentWedding.settings?.partner2Name || 'Partner 2';
  const coupleNames = currentWedding.name || `${partner1} & ${partner2}`;
  const venue = currentWedding.settings?.primaryVenueName || currentWedding.settings?.primaryCity || 'Venue Pending';
  const weddingSlug = currentWedding.slug;

  const totalGuests = guests.length;
  // Calculate attendance if available
  const attendingGuests = guests.filter((g: any) => g.rsvpStatus === 'ATTENDING' || g.status === 'ATTENDING').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. TOP BANNER & REAL-TIME COUNTDOWN STRIP */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/40 p-6 sm:p-8 flex flex-col xl:flex-row items-center justify-between gap-6">
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
              <span className="text-xs text-secondary font-semibold">Active Wedding</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
              Namaste {user?.name || 'Wedding Host'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Royal Wedding Concierge orchestration for <strong className="text-on-surface">{coupleNames}</strong> • {venue}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Countdown Pill */}
          <div className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/40 shadow-xs">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Muhurtham In
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
          {weddingSlug && (
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-primary" />}
              <span>{copied ? 'Link Copied!' : `/w/${weddingSlug}`}</span>
            </button>
          )}

          {/* Add Ceremony CTA */}
          <Link
            to={`/dashboard/${currentWedding.id}/events`}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Ceremony</span>
          </Link>
        </div>
      </section>

      {/* 2. DYNAMIC KPI METRICS RAIL (REAL DATABASE COUNTS) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Real Guest Count */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Guest Attendance
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">{attendingGuests}</span>
                <span className="text-sm text-on-surface-variant font-medium">/ {totalGuests}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary border border-primary-container/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>{totalGuests > 0 ? `${Math.round((attendingGuests / totalGuests) * 100)}% Confirmed` : 'No guests added yet'}</span>
            <Link to={`/dashboard/${currentWedding.id}/guests`} className="text-primary font-semibold hover:underline">
              Manage Guests ➔
            </Link>
          </div>
        </div>

        {/* KPI 2: Real Invitations Dispatched */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Digital Invitations
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">{invitationsCount}</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Dispatched</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary border border-secondary/20">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>WhatsApp Magic Links</span>
            <Link to={`/dashboard/${currentWedding.id}/invitations`} className="text-secondary font-semibold hover:underline">
              Send Invites ➔
            </Link>
          </div>
        </div>

        {/* KPI 3: Ceremonies Scheduled */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Sacred Ceremonies
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">{events.length}</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Scheduled</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary border border-primary-container/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Muhurtham & Receptions</span>
            <Link to={`/dashboard/${currentWedding.id}/events`} className="text-primary font-semibold hover:underline">
              View Itinerary ➔
            </Link>
          </div>
        </div>

        {/* KPI 4: Photos Uploaded */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-primary block mb-1">
                Photo Vault
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-bold text-on-surface">{photosCount}</span>
                <span className="text-xs text-tertiary font-semibold uppercase tracking-wider">Candid Snaps</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary border border-secondary/20">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Cloudinary Vault</span>
            <Link to={`/dashboard/${currentWedding.id}/gallery`} className="text-secondary font-semibold hover:underline">
              Open Vault ➔
            </Link>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC CEREMONY ITINERARY SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block">
              Muhurtham & Celebrations
            </span>
            <h2 className="font-serif text-2xl font-bold text-on-surface">
              Imperial Multi-Day Itinerary ({events.length})
            </h2>
          </div>
          <Link
            to={`/dashboard/${currentWedding.id}/events`}
            className="flex items-center space-x-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Manage All Ceremonies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 text-center space-y-3">
            <Calendar className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-serif text-lg font-bold text-on-surface">
              No Ceremonies Added Yet
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Schedule your Haldi, Mehndi, Sangeet, Sacred Muhurtham, and Reception with dates, times, and venue locations.
            </p>
            <Link
              to={`/dashboard/${currentWedding.id}/events`}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Ceremony</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const startDate = new Date(ev.startAt);
              const monthStr = startDate.toLocaleString('en-US', { month: 'short' });
              const dayStr = startDate.getDate();
              const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <article
                  key={ev.id}
                  className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 hover:border-primary transition-all flex items-start space-x-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex flex-col items-center justify-center shrink-0 border border-amber-200">
                    <span className="text-[10px] uppercase font-bold leading-none">{monthStr}</span>
                    <span className="font-serif text-lg font-bold leading-none mt-0.5">{dayStr}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-xs font-medium text-tertiary">
                      <span>{timeStr}</span>
                      <span>•</span>
                      <span className="text-secondary font-semibold">{ev.settings?.ritualType || 'Ceremony'}</span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-on-surface mt-0.5">
                      {ev.name}
                    </h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{ev.settings?.locationName || ev.venue?.name || venue}</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default WeddingView;
