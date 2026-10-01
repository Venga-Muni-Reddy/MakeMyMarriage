import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  websiteService,
  PublicWebsiteData,
  WeddingBlessingItem,
} from '../../services/website.service';
import {
  Sparkles,
  Volume2,
  VolumeX,
  MapPin,
  ExternalLink,
  Search,
  Crown,
  Plane,
  Ship,
  Hotel,
  SunMedium,
  MessageSquareHeart,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const PublicWeddingWebsiteView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PublicWebsiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // RSVP Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Blessing Form State
  const [authorName, setAuthorName] = useState('');
  const [blessingSide, setBlessingSide] = useState<'BRIDE' | 'GROOM' | 'NEUTRAL'>('NEUTRAL');
  const [blessingMessage, setBlessingMessage] = useState('');
  const [isSubmittingBlessing, setIsSubmittingBlessing] = useState(false);
  const [blessingsList, setBlessingsList] = useState<WeddingBlessingItem[]>([]);
  const [blessingSuccess, setBlessingSuccess] = useState(false);

  // Share Notification
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchWebsite = async () => {
      try {
        const siteData = await websiteService.getPublicWebsite(slug);
        setData(siteData);
        setBlessingsList(siteData.blessings || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Wedding website not found or private');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWebsite();
  }, [slug]);

  // Live Muhurtham Countdown Timer
  useEffect(() => {
    if (!data?.weddingDate && !data?.displayDate) return;

    // Use wedding date or fallback to Dec 19, 2026
    const targetDate = data?.weddingDate
      ? new Date(data.weddingDate).getTime()
      : new Date('2026-12-19T18:00:00+05:30').getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data]);

  // Audio Soundscape Controls
  const toggleAudio = () => {
    if (!audioRef.current && data?.soundscape?.audioUrl) {
      audioRef.current = new Audio(data.soundscape.audioUrl);
      audioRef.current.loop = true;
    }

    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch(() => {});
      }
    }
  };

  // Fast-Pass RSVP Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !lookupQuery.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const result = await websiteService.lookupGuestPass(slug, lookupQuery.trim());
      if (result.inviteUrl) {
        navigate(result.inviteUrl);
      } else if (result.token) {
        navigate(`/invite/${result.token}`);
      }
    } catch (err: any) {
      setLookupError(
        err.response?.data?.message ||
          'No invitation pass found matching that phone number or pass code. Please verify or contact the couple.'
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  // Submit Blessing
  const handleBlessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !authorName.trim() || !blessingMessage.trim()) return;

    setIsSubmittingBlessing(true);
    try {
      const newBlessing = await websiteService.submitBlessing(slug, {
        authorName: authorName.trim(),
        side: blessingSide,
        message: blessingMessage.trim(),
      });

      setBlessingsList((prev) => [newBlessing, ...prev]);
      setAuthorName('');
      setBlessingMessage('');
      setBlessingSuccess(true);
      setTimeout(() => setBlessingSuccess(false), 5000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit blessing. Please try again.');
    } finally {
      setIsSubmittingBlessing(false);
    }
  };

  const handleShareWebsite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#14060c] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-amber-200 tracking-widest text-sm animate-pulse">
            Unveiling Royal Wedding Website...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#1a080f] flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-red-500/20 backdrop-blur-xl">
          <Crown className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-red-200">Wedding Website Unavailable</h2>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            {error || 'The wedding website you are searching for does not exist or has not been published yet.'}
          </p>
          <div className="mt-6 pt-4 border-t border-white/10 flex justify-center gap-3 text-xs">
            <Link to="/" className="text-amber-300 hover:underline">
              Return Home
            </Link>
            <span>•</span>
            <Link to="/login" className="text-stone-400 hover:underline">
              Host Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Floating Audio Soundscape Player Pill */}
      {data.soundscape && (
        <button
          onClick={toggleAudio}
          className="fixed top-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/75 border border-amber-400/40 text-amber-200 text-xs backdrop-blur-md shadow-2xl hover:bg-black/90 transition-all cursor-pointer"
          title={isPlayingAudio ? 'Mute royal shehnai' : 'Play royal shehnai'}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="font-serif tracking-wider hidden sm:inline">Playing Shehnai</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-stone-400" />
              <span className="font-serif tracking-wider hidden sm:inline">♪ Auspicious Shehnai</span>
            </>
          )}
        </button>
      )}

      {/* Floating Share Link Pill */}
      <button
        onClick={handleShareWebsite}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xl transition-all cursor-pointer"
        title="Share wedding link"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">{copiedLink ? 'Link Copied! ✓' : 'Share Website'}</span>
      </button>

      {/* ==========================================
          SECTION 1: HERO & AUSPICIOUS COUNTDOWN
      ========================================== */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#2e0912] via-[#4f1020] to-[#1c050b] text-amber-100 overflow-hidden">
        {/* Subtle Decorative Gold Patterns */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Sanskrit Blessing Banner */}
        <div className="relative z-10 max-w-2xl px-4 py-1.5 rounded-full bg-black/30 border border-amber-400/30 text-[11px] sm:text-xs font-serif text-amber-300/90 tracking-widest backdrop-blur-xs mb-6">
          {data.sanskritShloka?.verse || '॥ ॐ श्री गणेशाय नमः ॥ मांगल्यं तन्तुनानेन लोकजीवनहेतुना ॥'}
        </div>

        {/* Monogram Crest */}
        <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#7a172e] via-[#af2545] to-[#7a172e] border-2 border-amber-300/60 shadow-[0_0_40px_rgba(212,175,55,0.25)] flex flex-col items-center justify-center text-amber-100 mb-6">
          <Crown className="w-6 h-6 text-amber-300" />
          <span className="font-serif font-bold text-2xl tracking-wider text-amber-200">
            {data.monogram}
          </span>
        </div>

        {/* Grand Typography */}
        <div className="relative z-10 space-y-2 max-w-4xl">
          <span className="text-[11px] uppercase font-bold tracking-[0.3em] text-amber-300">
            The Royal Nuptials Of
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            {data.brideName} <span className="text-amber-400 font-normal italic">&amp;</span> {data.groomName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 pt-2 flex items-center justify-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{data.primaryVenueName} • {data.primaryVenueCity}</span>
            <span>•</span>
            <span>{data.displayDate}</span>
          </p>
        </div>

        {/* Live Auspicious Muhurtham Countdown Clock */}
        <div className="relative z-10 mt-10 p-4 sm:p-6 rounded-3xl bg-black/40 border border-amber-400/30 backdrop-blur-md shadow-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300/90 block mb-3">
            Auspicious Muhurtham Countdown
          </span>
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
            <div className="px-3 py-2 sm:px-5 sm:py-3 rounded-2xl bg-white/5 border border-amber-300/30">
              <span className="font-serif text-2xl sm:text-4xl font-bold text-white block">
                {timeLeft.days}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-amber-200/70 tracking-wider">
                Days
              </span>
            </div>
            <div className="px-3 py-2 sm:px-5 sm:py-3 rounded-2xl bg-white/5 border border-amber-300/30">
              <span className="font-serif text-2xl sm:text-4xl font-bold text-white block">
                {timeLeft.hours}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-amber-200/70 tracking-wider">
                Hours
              </span>
            </div>
            <div className="px-3 py-2 sm:px-5 sm:py-3 rounded-2xl bg-white/5 border border-amber-300/30">
              <span className="font-serif text-2xl sm:text-4xl font-bold text-white block">
                {timeLeft.minutes}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-amber-200/70 tracking-wider">
                Minutes
              </span>
            </div>
            <div className="px-3 py-2 sm:px-5 sm:py-3 rounded-2xl bg-white/5 border border-amber-300/30">
              <span className="font-serif text-2xl sm:text-4xl font-bold text-amber-300 block animate-pulse">
                {timeLeft.seconds}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-amber-200/70 tracking-wider">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#ceremonies"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all transform active:scale-95"
          >
            ✦ Sacred Itinerary
          </a>
          <a
            href="#rsvp-lookup"
            className="px-6 py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-400/50 text-amber-200 font-bold text-xs uppercase tracking-wider backdrop-blur-xs shadow-lg transition-all transform active:scale-95"
          >
            ✦ Find My Invitation &amp; RSVP
          </a>
        </div>
      </section>

      {/* ==========================================
          SECTION 2: OUR ROYAL JOURNEY (LOVE STORY)
      ========================================== */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            A Union Ordained by Destiny
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Our Sacred Journey to Forever
          </h2>
          <div className="w-16 h-0.5 bg-amber-400 mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.loveStory.map((milestone) => (
            <div
              key={milestone.step}
              className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-serif font-bold text-sm flex items-center justify-center border border-amber-200">
                  {milestone.step}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  {milestone.date}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                {milestone.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          SECTION 3: SACRED CEREMONIES ITINERARY
      ========================================== */}
      <section id="ceremonies" className="py-20 px-6 bg-stone-100/70 border-y border-stone-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Ceremonial Schedule
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Sacred Rituals &amp; Celebrations
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              We warmly invite you to join hands with us across each auspicious rite as we embark on this sacred journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.events.map((ev) => {
              const startDate = new Date(ev.startAt);
              const dateStr = startDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const timeStr = startDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl bg-white border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                          {dateStr} • {timeStr}
                        </span>
                        <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">
                          {ev.name}
                        </h3>
                      </div>
                      {ev.isMandap && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Mandap VIP
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{ev.venueAddress}</span>
                    </div>

                    {/* Dress Code Badge */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                        Dress Code Attire
                      </span>
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${ev.dressCodeColor || 'bg-amber-50 text-amber-800'}`}>
                        ✦ {ev.dressCode}
                      </span>
                    </div>
                  </div>

                  <a
                    href={ev.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(ev.venueAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-primary text-stone-700 hover:text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>View Venue Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4: GUEST PASS & RSVP CONCIERGE GATEWAY
      ========================================== */}
      <section id="rsvp-lookup" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-[#2b0811] via-[#480f1e] to-[#1c050b] p-8 sm:p-12 text-amber-100 shadow-2xl border border-amber-400/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <span className="text-xs uppercase font-bold tracking-[0.25em] text-amber-300">
              Royal Concierge Fast-Pass
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Retrieve Your Imperial Invitation &amp; RSVP
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Received an invitation? Enter your 10-digit mobile number or 8-character Pass Code (e.g. <strong className="text-amber-200">MMM-OAPW8</strong>) to access your personalized pass, ceremony attendance, and VIP gate QR code.
            </p>

            <form onSubmit={handleLookup} className="pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="Enter Mobile Number or Pass Code (MMM-...)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-amber-400/30 text-white placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLookingUp ? (
                    <span>Looking Up...</span>
                  ) : (
                    <>
                      <span>Access Invitation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {lookupError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              <div className="text-[11px] text-stone-400 pt-1">
                Zero passwords required • Instant royal unboxing &amp; biometric gate pass
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 5: DESTINATION & TRAVEL CONCIERGE
      ========================================== */}
      <section className="py-20 px-6 bg-stone-100/70 border-t border-stone-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Out-of-Town Guests
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Destination &amp; Palace Concierge
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              Everything you need for a comfortable royal stay in the City of Lakes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Flight Arrivals */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Plane className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Flight Arrivals
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {data.travelConcierge.airport}. {data.travelConcierge.airportDistance}.
              </p>
            </div>

            {/* Palace Boat Jetty */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Ship className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Palace Transfers
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {data.travelConcierge.palaceTransfers}. Shuttles running on schedule.
              </p>
            </div>

            {/* Accommodations */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Hotel className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Palace Suites
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {data.travelConcierge.accommodationsNote}. Check your pass for suite keys.
              </p>
            </div>

            {/* Winter Weather */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <SunMedium className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Winter Weather
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {data.travelConcierge.weatherAdvisory}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 6: DIGITAL BLESSING WALL
      ========================================== */}
      <section className="py-20 px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Heartfelt Wishes
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Royal Blessings &amp; Well Wishes
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
            Inscribe your heartfelt prayers and congratulations for {data.brideName} &amp; {data.groomName}.
          </p>
        </div>

        {/* Submit Blessing Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-primary" />
            <span>Inscribe Your Blessing</span>
          </h3>

          <form onSubmit={handleBlessingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your Name / Dignitary Title
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Maharana Vikramaditya"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Connection to Couple
                </label>
                <select
                  value={blessingSide}
                  onChange={(e) => setBlessingSide(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="NEUTRAL">Family &amp; Dear Friends</option>
                  <option value="BRIDE">Bride's Family &amp; Friends</option>
                  <option value="GROOM">Groom's Family &amp; Friends</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Your Auspicious Message
              </label>
              <textarea
                value={blessingMessage}
                onChange={(e) => setBlessingMessage(e.target.value)}
                placeholder="Write your prayers, blessings, and warm congratulations..."
                rows={3}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {blessingSuccess ? (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your blessing has been inscribed!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={isSubmittingBlessing}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingBlessing ? 'Inscribing...' : 'Send Royal Blessing'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Blessings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blessingsList.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900">{b.authorName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  b.side === 'GROOM' ? 'bg-amber-100 text-amber-800' : b.side === 'BRIDE' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
                }`}>
                  {b.side === 'GROOM' ? 'Groom Side' : b.side === 'BRIDE' ? 'Bride Side' : 'Well-Wisher'}
                </span>
              </div>
              <p className="text-xs text-stone-600 italic leading-relaxed">
                "{b.message}"
              </p>
              <div className="text-[10px] text-stone-400 pt-1">
                {new Date(b.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          SECTION 7: FOOTER
      ========================================== */}
      <footer className="bg-gradient-to-b from-[#24080e] to-[#120307] text-amber-100 py-12 px-6 border-t border-amber-400/20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-amber-300/40 flex items-center justify-center text-amber-300 mx-auto">
          <Crown className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h4 className="font-serif font-bold text-xl text-white">
            {data.brideName} &amp; {data.groomName}
          </h4>
          <p className="text-xs text-stone-400">
            Destination Wedding Udaipur • {data.displayDate}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-300">
          <a href="#ceremonies" className="hover:text-amber-300 transition-colors">
            Itinerary
          </a>
          <a href="#rsvp-lookup" className="hover:text-amber-300 transition-colors">
            RSVP Gateway
          </a>
          <Link to="/login" className="hover:text-amber-300 transition-colors">
            Host &amp; Organizer Portal
          </Link>
        </div>

        <div className="pt-6 border-t border-white/10 text-[11px] text-stone-500">
          Crafted with royal elegance by <strong className="text-amber-300">MakeMyMarriage</strong> • All rights reserved
        </div>
      </footer>
    </div>
  );
};
