import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  invitationService,
  PublicInvitationPass,
} from '../../services/invitation.service';
import {
  rsvpService,
  RsvpStatusType,
} from '../../services/rsvp.service';
import {
  Sparkles,
  Volume2,
  VolumeX,
  QrCode,
  CheckCircle2,
  Calendar,
  MapPin,
  Crown,
  UtensilsCrossed,
  Hotel,
  Car,
  MessageSquareHeart,
  XCircle,
  RefreshCw,
  PartyPopper,
} from 'lucide-react';

const DIETARY_OPTIONS = [
  { id: 'PURE_VEG', label: 'Pure Veg Satvik', desc: 'No onion/garlic upon request, traditional Indian vegetarian', icon: '🌿' },
  { id: 'JAIN', label: 'Jain Saatvik', desc: 'Strict Jain preparation, root vegetable-free', icon: '🪷' },
  { id: 'NON_VEG', label: 'Standard Royal Feast', desc: 'Royal Awadhi & Mughlai selections + vegetarian spreads', icon: '🍗' },
  { id: 'VEGAN', label: 'Plant-Based Vegan', desc: '100% dairy-free and plant-based royal preparations', icon: '🌱' },
  { id: 'GLUTEN_FREE', label: 'Gluten Conscious', desc: 'Millet & buckwheat breads, gluten-free specialties', icon: '🌾' },
];

export const PublicInvitationView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [pass, setPass] = useState<PublicInvitationPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [isRsvpDone, setIsRsvpDone] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isEditingRsvp, setIsEditingRsvp] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Form States
  const [overallStatus, setOverallStatus] = useState<RsvpStatusType>('ATTENDING');
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [selectedDietary, setSelectedDietary] = useState<string>('PURE_VEG');
  const [allergies, setAllergies] = useState<string>('');
  const [accommodationRequired, setAccommodationRequired] = useState<boolean>(false);
  const [transportationRequired, setTransportationRequired] = useState<boolean>(false);
  const [transportationDetails, setTransportationDetails] = useState<string>('');
  const [blessingMessage, setBlessingMessage] = useState<string>('');
  const [ceremonyStatusMap, setCeremonyStatusMap] = useState<Record<string, RsvpStatusType>>({});

  useEffect(() => {
    if (!token) return;
    const fetchPass = async () => {
      try {
        const data = await invitationService.getPublicPass(token);
        setPass(data);
        
        // Initial pax and ceremonies
        const initialCount = data.guest.paxCount || 1;
        setAttendeeCount(initialCount);
        setSelectedDietary(data.guest.dietary || 'PURE_VEG');

        const initialMap: Record<string, RsvpStatusType> = {};
        data.events.forEach((ev) => {
          initialMap[ev.id] = 'ATTENDING';
        });
        setCeremonyStatusMap(initialMap);

        // Check if guest has existing RSVP
        try {
          const rsvpData = await rsvpService.getPublicRsvp(token);
          if (rsvpData?.rsvp?.status === 'ATTENDING' || data.guest.rsvpStatus === 'ATTENDING') {
            setIsRsvpDone(true);
            if (rsvpData?.rsvp?.attendeeCount) {
              setAttendeeCount(rsvpData.rsvp.attendeeCount);
            }
          }
        } catch {
          // If no previous RSVP, guest fills it fresh
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired invitation token');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPass();
  }, [token]);

  const handleBreakSeal = () => {
    setIsSealBroken(true);
    if (pass?.soundscape?.audioUrl && !isPlayingAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(pass.soundscape.audioUrl);
        audioRef.current.loop = true;
      }
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current && pass?.soundscape?.audioUrl) {
      audioRef.current = new Audio(pass.soundscape.audioUrl);
      audioRef.current.loop = true;
    }
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }
    }
  };

  const handleCeremonyStatusChange = (eventId: string, status: RsvpStatusType) => {
    setCeremonyStatusMap((prev) => ({
      ...prev,
      [eventId]: status,
    }));
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !pass) return;

    setIsSubmitting(true);
    try {
      const ceremonyResponses = pass.events.map((ev) => ({
        eventId: ev.id,
        status: ceremonyStatusMap[ev.id] || 'ATTENDING',
        attendeeCount: overallStatus === 'NOT_ATTENDING' ? 0 : attendeeCount,
      }));

      await rsvpService.submitPublicRsvp(token, {
        overallStatus,
        attendeeCount: overallStatus === 'NOT_ATTENDING' ? 0 : attendeeCount,
        foodPreference: selectedDietary,
        allergies: allergies.trim() || undefined,
        accommodationRequired,
        transportationRequired,
        transportationDetails: transportationRequired ? transportationDetails : undefined,
        message: blessingMessage.trim() || undefined,
        ceremonyResponses,
      });

      setIsRsvpDone(true);
      setIsEditingRsvp(false);
      setShowCelebration(true);

      // Auto dismiss celebration banner after 6 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 6000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#12080d] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-headline-sm text-amber-200 tracking-wider text-sm animate-pulse">
            Consulting Imperial Registry...
          </p>
        </div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-[#1a0a10] flex items-center justify-center p-4 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-red-500/20 backdrop-blur-xl text-white">
          <Crown className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-headline-md text-xl font-bold text-red-200">Invalid Invitation Pass</h2>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            {error || 'The imperial invitation link or pass code is invalid, expired, or has been revoked.'}
          </p>
          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-stone-500">
            Please contact the royal concierge or the wedding host family.
          </div>
        </div>
      </div>
    );
  }

  const theme = pass.theme || {
    bgGradient: 'from-[#5e1224] via-[#851d38] to-[#3a0a16]',
  };

  const attendingEventsCount = pass.events.filter(
    (ev) => (ceremonyStatusMap[ev.id] || 'ATTENDING') === 'ATTENDING'
  ).length;

  return (
    <div className="min-h-screen bg-[#12080d] text-stone-100 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px]" />
      
      {/* Soundscape Control Floating Pill */}
      {pass.soundscape && (
        <button
          onClick={toggleAudio}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/40 text-amber-200 text-xs backdrop-blur-md shadow-xl hover:bg-black/80 transition-all cursor-pointer"
          title={isPlayingAudio ? 'Mute royal shehnai' : 'Play royal shehnai'}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Playing Shehnai</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-stone-400" />
              <span className="hidden sm:inline">Auspicious Music</span>
            </>
          )}
        </button>
      )}

      {/* Confetti Celebration Banner when RSVP Submitted */}
      {showCelebration && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white">
          <PartyPopper className="w-8 h-8 flex-shrink-0 text-amber-950" />
          <div>
            <div className="text-sm font-headline-sm uppercase tracking-wider">Auspicious Confirmation!</div>
            <div className="text-xs font-normal">Your royal RSVP has been immortalized in the court registry.</div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl relative z-10 my-4 sm:my-8">
        {!isSealBroken ? (
          /* State 1: Virtual Imperial Wax Seal Envelope */
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#240e15] to-[#16060c] border border-amber-400/30 shadow-[0_0_60px_rgba(212,175,55,0.15)] text-center flex flex-col items-center space-y-6 animate-fadeIn">
            <div className="w-12 h-12 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-300 bg-amber-400/5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-400/90">
                Imperial Wedding Invitation
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold mt-1 text-white tracking-wide">
                {pass.coupleNames.brideName} &amp; {pass.coupleNames.groomName}
              </h2>
              <p className="text-xs text-stone-400 mt-2">
                A personal royal summons awaits your presence.
              </p>
            </div>

            {/* Interactive Wax Seal */}
            <div
              onClick={handleBreakSeal}
              className="cursor-pointer group relative flex flex-col items-center py-4 my-2"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#8a1c36] via-[#d2335a] to-[#8a1c36] flex items-center justify-center shadow-2xl border-4 border-amber-200/70 group-hover:scale-105 active:scale-95 transition-all">
                <div className="w-20 h-20 rounded-full border border-amber-200/50 flex flex-col items-center justify-center text-amber-100">
                  <Crown className="w-6 h-6 text-amber-200" />
                  <span className="font-headline-md font-bold text-xl tracking-wider">
                    {pass.coupleNames.monogram}
                  </span>
                </div>
              </div>
              <span className="mt-4 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold tracking-widest uppercase animate-pulse">
                ✦ Tap to Break Imperial Seal ✦
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs text-amber-100/70">
              Presented with royal reverence to:{' '}
              <strong className="text-amber-200">{pass.guest.honorific} {pass.guest.displayName}</strong>
            </div>
          </div>
        ) : (
          /* State 2: Unveiled Royal Invitation Folio */
          <div className="rounded-3xl bg-[#faf6ee] text-[#1e1b19] shadow-2xl border-4 border-amber-400/60 overflow-hidden animate-slideUp">
            {/* Top Ornamental Header */}
            <div className={`p-8 text-center bg-gradient-to-b ${theme.bgGradient} text-amber-100 relative`}>
              <div className="w-8 h-8 mx-auto text-amber-300 mb-2">
                <Sparkles className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                Shubh Vivah Aamantran
              </span>
              <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold mt-1 tracking-tight text-white">
                {pass.coupleNames.brideName} &amp; {pass.coupleNames.groomName}
              </h1>

              {/* Sanskrit Shloka Box */}
              <div className="mt-4 p-4 rounded-xl bg-black/25 border border-amber-200/20 backdrop-blur-xs text-xs sm:text-sm font-headline-sm italic text-amber-100 leading-relaxed shadow-inner">
                "{pass.verse.text}"
              </div>
            </div>

            {/* Body Content */}
            <div className="p-5 sm:p-8 space-y-6">
              {/* Dignitary Allocation Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-center space-y-1 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                  Imperial Guest Pass
                </span>
                <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface">
                  {pass.guest.honorific} {pass.guest.displayName}
                </h3>
                <p className="text-xs text-secondary font-semibold">
                  Granted: Up to {pass.guest.paxCount} Esteemed Guests • {pass.guest.allocatedSuite || 'Palace Guest Wing'}
                </p>
                <div className="text-[11px] text-on-surface-variant pt-1 flex items-center justify-center gap-2">
                  <span>Household: <strong>{pass.guest.householdName}</strong></span>
                  <span>•</span>
                  <span>Mandate: <strong className="text-primary">{pass.guest.dietary}</strong></span>
                </div>
              </div>

              {/* IF RSVP IS CONFIRMED AND NOT EDITING -> SHOW CONFIRMED PASS STATE */}
              {isRsvpDone && !isEditingRsvp ? (
                <div className="space-y-6">
                  {/* Verified Confirmation Card */}
                  <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-950 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-headline-sm font-bold text-base text-emerald-900">
                          Royal RSVP Immortalized
                        </h4>
                        <p className="text-xs text-emerald-700">
                          Status: {overallStatus === 'NOT_ATTENDING' ? 'Regretfully Declined' : `Confirmed (${attendeeCount} Guests Attending)`}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Dietary Selection</span>
                        <span className="font-bold text-emerald-900">{selectedDietary}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Rituals Attending</span>
                        <span className="font-bold text-emerald-900">{attendingEventsCount} of {pass.events.length}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Palace Quarters</span>
                        <span className="font-bold text-emerald-900">{accommodationRequired ? 'Requested ✓' : 'Self-Arranged'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Airport Transit</span>
                        <span className="font-bold text-emerald-900">{transportationRequired ? 'Requested ✓' : 'Self-Arranged'}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Entrance Pass */}
                  <div className="p-6 rounded-2xl bg-white border border-amber-200 flex flex-col items-center text-center shadow-md">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary mb-2">
                      Official Security Gate Pass
                    </span>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <QrCode className="w-36 h-36 text-primary" />
                    </div>
                    <span className="font-mono text-sm font-bold text-primary mt-3 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200">
                      {pass.guest.qrPassCode}
                    </span>
                    <span className="text-xs text-on-surface-variant mt-2 max-w-xs">
                      Present this pass to royal guards at palace gates for instant VIP registration.
                    </span>
                  </div>

                  {/* Update RSVP Button */}
                  <button
                    type="button"
                    onClick={() => setIsEditingRsvp(true)}
                    className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-stone-300 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Modify Royal Attendance or Dietary Choices</span>
                  </button>
                </div>
              ) : (
                /* INTERACTIVE RSVP SUBMISSION FORM (Stitch Design Prompt 1) */
                <form onSubmit={handleSubmitRsvp} className="space-y-6">
                  {/* Overall Attendance Toggle */}
                  <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
                      Will you grace our auspicious union?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOverallStatus('ATTENDING')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          overallStatus === 'ATTENDING'
                            ? 'bg-primary text-white shadow-md border-2 border-primary'
                            : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>With Joy, Attending</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOverallStatus('NOT_ATTENDING')}
                        className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          overallStatus === 'NOT_ATTENDING'
                            ? 'bg-rose-700 text-white shadow-md border-2 border-rose-700'
                            : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Regretfully Unable</span>
                      </button>
                    </div>
                  </div>

                  {overallStatus !== 'NOT_ATTENDING' && (
                    <>
                      {/* Companion / Headcount Stepper */}
                      <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-on-surface block">
                              Total Guests Attending
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              Allocated up to {pass.guest.paxCount} royal seats
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setAttendeeCount((c) => Math.max(1, c - 1))}
                              disabled={attendeeCount <= 1}
                              className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 font-bold flex items-center justify-center text-lg transition-all"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-lg text-primary">
                              {attendeeCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAttendeeCount((c) => Math.min(pass.guest.paxCount, c + 1))}
                              disabled={attendeeCount >= pass.guest.paxCount}
                              className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 font-bold flex items-center justify-center text-lg transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Ceremony Attendance Selector */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-headline-sm text-xs uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>Ceremony Attendance Matrix</span>
                          </h4>
                          <span className="text-[11px] text-on-surface-variant font-medium">
                            {attendingEventsCount} Selected
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {pass.events.map((ev) => {
                            const curStatus = ceremonyStatusMap[ev.id] || 'ATTENDING';
                            return (
                              <div
                                key={ev.id}
                                className="p-3.5 rounded-xl bg-white border border-outline-variant/30 space-y-2 shadow-xs"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                                      <span>{ev.name}</span>
                                      {ev.isMandap && (
                                        <span className="px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-bold">
                                          Mandap Seating
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-primary" /> {ev.venueName}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Tri-State Buttons: Attending, Decline, Maybe */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCeremonyStatusChange(ev.id, 'ATTENDING')}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                      curStatus === 'ATTENDING'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                                    }`}
                                  >
                                    Attending ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCeremonyStatusChange(ev.id, 'MAYBE')}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                      curStatus === 'MAYBE'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                                    }`}
                                  >
                                    Maybe ?
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCeremonyStatusChange(ev.id, 'NOT_ATTENDING')}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                      curStatus === 'NOT_ATTENDING'
                                        ? 'bg-stone-700 text-white shadow-xs'
                                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                                    }`}
                                  >
                                    Decline ✗
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Banquet Dietary Preferences */}
                      <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                          <UtensilsCrossed className="w-4 h-4 text-primary" />
                          <span>Indian Banquet Dining Preference</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {DIETARY_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedDietary(opt.id)}
                              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                                selectedDietary === opt.id
                                  ? 'bg-amber-50/80 border-primary text-primary shadow-xs ring-1 ring-primary'
                                  : 'bg-stone-50/60 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5">
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </div>
                              <div className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                                {opt.desc}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Allergy Input */}
                        <div className="pt-2">
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Specific Allergies or Medical Dietary Restrictions (Optional)
                          </label>
                          <input
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. Nut allergy, lactose intolerant, diabetic menu..."
                            className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Hospitality & Quarters Logistics */}
                      <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs space-y-3">
                        <span className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                          Royal Logistics &amp; Concierge
                        </span>

                        <div className="space-y-2.5">
                          <label className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-all">
                            <input
                              type="checkbox"
                              checked={accommodationRequired}
                              onChange={(e) => setAccommodationRequired(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                                <Hotel className="w-3.5 h-3.5 text-secondary" />
                                Palace Suite Accommodation Needed
                              </span>
                              <span className="text-[11px] text-stone-500 block">
                                Request complimentary quarters in the royal estate guest wing
                              </span>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200 cursor-pointer hover:bg-stone-100/70 transition-all">
                            <input
                              type="checkbox"
                              checked={transportationRequired}
                              onChange={(e) => setTransportationRequired(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-secondary" />
                                Airport / Train Station Chauffeur Pickup
                              </span>
                              <span className="text-[11px] text-stone-500 block">
                                Royal motorcade reception at Udaipur Maharana Pratap Airport (UDR)
                              </span>
                            </div>
                          </label>

                          {transportationRequired && (
                            <input
                              type="text"
                              value={transportationDetails}
                              onChange={(e) => setTransportationDetails(e.target.value)}
                              placeholder="Flight / Train number and estimated arrival time..."
                              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Royal Blessing Book */}
                  <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 shadow-xs space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                      <MessageSquareHeart className="w-4 h-4 text-primary" />
                      <span>Heartfelt Blessings for the Couple</span>
                    </label>
                    <textarea
                      value={blessingMessage}
                      onChange={(e) => setBlessingMessage(e.target.value)}
                      rows={3}
                      placeholder="Write your auspicious prayers and warm blessings for the bride and groom..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-[#5e1224] via-[#851d38] to-[#5e1224] hover:from-[#6e152a] hover:to-[#6e152a] text-amber-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all border border-amber-400/40 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
                          <span>Inscribing into Royal Registry...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 text-amber-300" />
                          <span>✦ Seal &amp; Confirm Royal RSVP ✦</span>
                        </>
                      )}
                    </button>
                    {isEditingRsvp && (
                      <button
                        type="button"
                        onClick={() => setIsEditingRsvp(false)}
                        className="w-full mt-2 py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                      >
                        Cancel modification
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-4 bg-stone-100 border-t border-stone-200 text-center text-[11px] text-stone-500">
              <span>MakeMyMarriage Royal Concierge • Destination Wedding Udaipur</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
