import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  invitationService,
  PublicInvitationPass,
} from '../../services/invitation.service';
import {
  Sparkles,
  Volume2,
  VolumeX,
  QrCode,
  CheckCircle2,
  Calendar,
  MapPin,
  Heart,
  Crown,
} from 'lucide-react';

export const PublicInvitationView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [pass, setPass] = useState<PublicInvitationPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [isRsvpDone, setIsRsvpDone] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchPass = async () => {
      try {
        const data = await invitationService.getPublicPass(token);
        setPass(data);
        if (data.guest.rsvpStatus === 'ATTENDING') {
          setIsRsvpDone(true);
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
    // Play Shehnai music on unboxing if available
    if (pass?.soundscape?.audioUrl && !isPlayingAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(pass.soundscape.audioUrl);
      }
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current && pass?.soundscape?.audioUrl) {
      audioRef.current = new Audio(pass.soundscape.audioUrl);
    }
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
        <h2 className="font-headline-md text-xl font-bold text-on-surface">Unveiling Royal Seal...</h2>
        <p className="text-xs text-on-surface-variant mt-1">Consulting the imperial palace registry</p>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary-fixed/40 text-secondary flex items-center justify-center mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="font-headline-md text-2xl font-bold text-on-surface">Royal Invitation Not Found</h2>
        <p className="text-sm text-on-surface-variant mt-2 max-w-md">
          {error || 'This digital invitation link may be expired or revoked by the chancery.'}
        </p>
        <a
          href="/"
          className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold shadow-md"
        >
          Return to MakeMyMarriage
        </a>
      </div>
    );
  }

  const theme = pass.theme;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a120b] via-[#2d1c10] to-[#120a05] text-[#fff8f5] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-body">
      {/* Background Decorative Jaali Glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#bf8e42_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Floating Audio Controller */}
      {pass.soundscape && (
        <button
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-surface-container-lowest/20 backdrop-blur-md border border-amber-300/30 text-amber-200 hover:scale-105 transition-all shadow-lg flex items-center gap-2 text-xs font-semibold"
        >
          {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{pass.soundscape.raga}</span>
        </button>
      )}

      {/* Main Container */}
      <div className="max-w-xl w-full z-10 my-8">
        {!isSealBroken ? (
          /* State 1: Sealed Imperial Envelope */
          <div className="flex flex-col items-center text-center space-y-6 animate-fadeIn">
            <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-widest uppercase">
              Shubh Vivah Aamantran
            </span>

            <h1 className="font-headline-lg text-3xl sm:text-4xl font-bold tracking-tight text-amber-100">
              {pass.weddingName}
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-sm">
              An imperial invitation has been addressed to your esteemed household.
            </p>

            {/* Interactive Wax Seal */}
            <div
              onClick={handleBreakSeal}
              className="group cursor-pointer my-8 flex flex-col items-center transition-transform active:scale-95"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#8a1c36] via-[#d2335a] to-[#8a1c36] flex items-center justify-center shadow-2xl border-4 border-amber-200/70 group-hover:scale-105 transition-all">
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
              Addressed to:{' '}
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
              <div className="mt-4 p-4 rounded-xl bg-black/20 border border-amber-200/20 backdrop-blur-xs text-xs sm:text-sm font-headline-sm italic text-amber-100 leading-relaxed">
                "{pass.verse.text}"
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Dignitary Allocation Card */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                  Imperial Guest Pass
                </span>
                <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface">
                  {pass.guest.displayName}
                </h3>
                <p className="text-xs text-secondary font-semibold">
                  Granted: {pass.guest.paxCount} Esteemed Guests • {pass.guest.allocatedSuite || 'Palace Guest Wing'}
                </p>
                <div className="text-[11px] text-on-surface-variant pt-1">
                  Dietary Mandate: <strong className="text-primary">{pass.guest.dietary}</strong>
                </div>
              </div>

              {/* Ceremony Access List */}
              <div className="space-y-2.5">
                <h4 className="font-headline-sm text-xs uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Scheduled Sacred Ceremonies</span>
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {pass.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-white border border-outline-variant/30 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            ev.isMandap ? 'bg-secondary' : 'bg-primary'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                            <span>{ev.name}</span>
                            {ev.isMandap && (
                              <span className="px-2 py-0.2 rounded bg-secondary text-white text-[10px] font-bold">
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
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/50">
                        Invited ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Entrance Pass */}
              <div className="p-4 rounded-2xl bg-white border border-outline-variant/40 flex flex-col items-center text-center shadow-xs">
                <QrCode className="w-36 h-36 text-primary" />
                <span className="font-mono text-xs font-bold text-primary mt-2">
                  {pass.guest.qrPassCode}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  Present this gate pass upon arrival at the palace security pavilion
                </span>
              </div>

              {/* RSVP Action */}
              <div className="pt-2">
                {isRsvpDone ? (
                  <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Royal RSVP Confirmed ({pass.guest.paxCount} Attending)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsRsvpDone(true)}
                    className="w-full py-3.5 bg-secondary hover:bg-secondary/90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-amber-200" />
                    <span>Accept Royal Invitation &amp; Confirm Attendance</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 text-center text-[11px] text-on-surface-variant">
              <span>MakeMyMarriage Royal Concierge • Destination Wedding Udaipur</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
