import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Share2,
  Settings,
  Sparkles,
  Users,
  Flame,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Globe,
  Radio,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Crown,
  AlertCircle
} from 'lucide-react';
import {
  livestreamService,
  ActiveStreamResponse,
  ChatMessageItem,
  RitualMilestoneItem,
} from '../../services/livestream.service';
import { useWedding } from '../../context/WeddingContext';

// 7 Sacred Vedic Vows details for Saptapadi
const SACRED_VOWS = [
  {
    step: 1,
    title: 'First Phera: Nourishment & Provision',
    sanskrit: 'ॐ एकमिषे विष्णुस्त्वान्वेतु | Om ekamishē viṣṇustvānvētu',
    meaning: 'We take the first step together to provide nourish-ment, health, and pure food for our home.',
  },
  {
    step: 2,
    title: 'Second Phera: Strength & Protection',
    sanskrit: 'ॐ द्वे ऊर्जे विष्णुस्त्वान्वेतु | Om dvē ūrjē viṣṇustvānvētu',
    meaning: 'We take the second step to develop physical, mental, and spiritual strength to protect each other.',
  },
  {
    step: 3,
    title: 'Third Phera: Prosperity & Righteous Wealth',
    sanskrit: 'ॐ त्रीणि रायस्पोषाय विष्णुस्त्वान्वेतु | Om trīṇi rāyaspōṣāya viṣṇustvānvētu',
    meaning: 'We take the third step to prosper with righteous means and share our abundance with the world.',
  },
  {
    step: 4,
    title: 'Fourth Phera: Harmony, Mutual Respect & Joy',
    sanskrit: 'ॐ चत्वारि मायोभवाय विष्णुस्त्वान्वेतु | Om catvāri māyōbhavāya viṣṇustvānvētu',
    meaning: 'We take the fourth step for lifelong mutual respect, joyful companionship, and inner peace.',
  },
  {
    step: 5,
    title: 'Fifth Phera: Lineage, Family & Progeny',
    sanskrit: 'ॐ पञ्च पशुभ्यो विष्णुस्त्वान्वेतु | Om pañca paśubhyō viṣṇustvānvētu',
    meaning: 'We take the fifth step for the health and virtuous upbringing of our future generations.',
  },
  {
    step: 6,
    title: 'Sixth Phera: Seasons, Health & Longevity',
    sanskrit: 'ॐ षड् ॠतुभ्यो विष्णुस्त्वान्वेतु | Om ṣaḍ ṛtubhyō viṣṇustvānvētu',
    meaning: 'We take the sixth step to remain united through all seasons of life in radiant health and devotion.',
  },
  {
    step: 7,
    title: 'Seventh Phera: Eternal Friendship & Unity',
    sanskrit: 'ॐ सखे सप्तपदा भव | Om sakhē saptapadā bhava',
    meaning: 'With this final step, we become eternal companions — two souls united by the sacred fire forever.',
  },
];

interface FloatingPetal {
  id: number;
  x: number;
  y: number;
  char: string;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
}

export const LiveStreamBroadcastView: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { currentWedding } = useWedding();
  const activeWeddingId = weddingId || currentWedding?.id || '';

  // Stream state
  const [streamData, setStreamData] = useState<ActiveStreamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-camera states
  const [activeCam, setActiveCam] = useState<'cam1' | 'cam2' | 'cam3'>('cam1');
  const [petalsShowerActive, setPetalsShowerActive] = useState(true);

  // Interactive 7-Vow tracker state
  const [currentVowIndex, setCurrentVowIndex] = useState(3); // 4th Vow (0-indexed)

  // Floating reaction bursts
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; char: string; left: number }[]>([]);

  // Broadcaster Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formStreamUrl, setFormStreamUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPrivacy, setFormPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [formPasscode, setFormPasscode] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Blessing Form
  const [blessingAuthor, setBlessingAuthor] = useState('');
  const [blessingLocation, setBlessingLocation] = useState('');
  const [blessingMessage, setBlessingMessage] = useState('');
  const [isFamilyMember, setIsFamilyMember] = useState(true);
  const [isSendingBlessing, setIsSendingBlessing] = useState(false);
  const [blessingsList, setBlessingsList] = useState<ChatMessageItem[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Canvas for falling rose petals
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petalsRef = useRef<FloatingPetal[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Load Active Stream Data
  const loadStream = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await livestreamService.getActiveStream(activeWeddingId);
      setStreamData(data);
      setBlessingsList(data.chatMessages || []);
      setFormStreamUrl(data.streamUrl || '');
      setFormTitle(data.title || '');
      setFormPrivacy(data.telemetry?.privacy || 'PUBLIC');
      setFormPasscode(data.telemetry?.passcode || 'MANDAP2026');
      if (data.activeVow) {
        setCurrentVowIndex(Math.max(0, Math.min(6, data.activeVow - 1)));
      }
    } catch (err: any) {
      console.error('Failed to load stream:', err);
      setError(err?.message || 'Could not load virtual mandap broadcast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStream();
  }, [activeWeddingId]);

  // Rose petals canvas particle engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const petalChars = ['🌸', '🌹', '🌺', '✨', '🏵️'];

    // Spawn 24 initial drifting petals
    const initPetals: FloatingPetal[] = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      char: petalChars[Math.floor(Math.random() * petalChars.length)],
      size: Math.random() * 12 + 14,
      opacity: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * 1.2,
      vy: Math.random() * 1.5 + 0.8,
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 2,
    }));
    petalsRef.current = initPetals;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (petalsShowerActive) {
        petalsRef.current.forEach((p) => {
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.y * 0.02) * 0.6;
          p.rot += p.vRot;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.font = `${p.size}px serif`;
          ctx.globalAlpha = p.opacity;
          ctx.fillText(p.char, -p.size / 2, p.size / 2);
          ctx.restore();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [petalsShowerActive]);

  // Trigger burst of petals when user clicks "Shower Petals"
  const triggerPetalShowerBurst = async () => {
    if (!streamData) return;
    const canvas = canvasRef.current;
    const w = canvas?.width || 800;
    const h = canvas?.height || 500;
    const burstChars = ['🌹', '🌸', '🌺', '✨', '🏵️'];

    const newBursts: FloatingPetal[] = Array.from({ length: 30 }).map((_, i) => ({
      id: Date.now() + i,
      x: w / 2 + (Math.random() - 0.5) * (w * 0.6),
      y: h + 10,
      char: burstChars[Math.floor(Math.random() * burstChars.length)],
      size: Math.random() * 16 + 18,
      opacity: 0.95,
      vx: (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 4 + 3.5),
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 4,
    }));

    petalsRef.current = [...petalsRef.current, ...newBursts];

    // Optimistically increment petal count
    setStreamData((prev) =>
      prev
        ? {
            ...prev,
            telemetry: {
              ...prev.telemetry,
              petalsCount: prev.telemetry.petalsCount + 50,
            },
          }
        : null
    );

    try {
      await livestreamService.showerPetals(activeWeddingId, streamData.id, 50);
    } catch (e) {
      console.error('Petals sync failed', e);
    }
  };

  // Quick Emoji Reactions
  const handleQuickReaction = (char: string) => {
    const newId = Date.now();
    const leftPercent = Math.floor(Math.random() * 70) + 15;
    setFloatingReactions((prev) => [...prev, { id: newId, char, left: leftPercent }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newId));
    }, 2400);

    triggerPetalShowerBurst();
  };

  // Post a Blessing
  const handleSendBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamData || !blessingAuthor.trim() || !blessingMessage.trim()) return;

    setIsSendingBlessing(true);
    const author = blessingAuthor.trim();
    const loc = blessingLocation.trim() || 'Worldwide';
    const msg = blessingMessage.trim();

    try {
      const res = await livestreamService.sendBlessing(activeWeddingId, streamData.id, {
        authorName: author,
        location: loc,
        message: msg,
        isFamily: isFamilyMember,
      });

      setBlessingsList((prev) => [res.message, ...prev]);
      setStreamData((prev) =>
        prev
          ? {
              ...prev,
              telemetry: {
                ...prev.telemetry,
                petalsCount: res.petalsCount,
              },
            }
          : null
      );

      setBlessingMessage('');
      handleQuickReaction('🌹');
    } catch (err: any) {
      console.error('Failed to post blessing:', err);
      alert('Could not submit your blessing. Please try again.');
    } finally {
      setIsSendingBlessing(false);
    }
  };

  // Switch Active Ritual
  const handleAdvanceRitual = async (ritual: RitualMilestoneItem) => {
    if (!streamData) return;
    try {
      const updated = await livestreamService.updateStream(activeWeddingId, streamData.id, {
        currentRitual: ritual.name,
      });
      setStreamData(updated);
    } catch (err) {
      console.error('Failed to update ritual:', err);
    }
  };

  // Change Active Vow
  const handleSelectVow = async (vowStep: number) => {
    setCurrentVowIndex(vowStep - 1);
    if (!streamData) return;
    try {
      await livestreamService.updateStream(activeWeddingId, streamData.id, {
        activeVow: vowStep,
      });
    } catch (err) {
      console.error('Failed to update active vow', err);
    }
  };

  // Save Stream Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamData) return;
    setIsSavingSettings(true);
    try {
      const updated = await livestreamService.updateStream(activeWeddingId, streamData.id, {
        streamUrl: formStreamUrl,
        title: formTitle,
        privacy: formPrivacy,
        passcode: formPasscode,
      });
      setStreamData(updated);
      setIsSettingsOpen(false);
    } catch (err: any) {
      alert('Failed to save settings: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  if (loading && !streamData) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-amber-100 p-8 space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin flex items-center justify-center">
          <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
        <p className="font-serif text-lg tracking-wide text-amber-200">
          Connecting to Royal Virtual Mandap & Havankund Stream...
        </p>
      </div>
    );
  }

  if (error && !streamData) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-amber-100 p-8 space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-xl font-bold text-red-200">
          Virtual Mandap Stream Unavailable
        </h2>
        <p className="text-stone-400 text-sm max-w-md">{error}</p>
        <button
          onClick={loadStream}
          className="mt-4 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-lg transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const embedUrl = streamData?.embedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1';
  const petalsFormatted = Number(streamData?.telemetry?.petalsCount || 0).toLocaleString();
  const viewersCount = Number(streamData?.telemetry?.viewerCount || 0).toLocaleString();
  const activeVow = SACRED_VOWS[currentVowIndex] || SACRED_VOWS[3];

  return (
    <div className="min-h-screen bg-[#0c0908] text-stone-100 font-sans selection:bg-amber-700 selection:text-amber-50 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP ROYAL BANNER (NON-STICKY TO PREVENT OVERLAP SCROLL ISSUES) */}
      {/* ========================================================================= */}
      <header className="border-b border-amber-900/30 bg-gradient-to-r from-[#170e0b] via-[#211410] to-[#170e0b] px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Mandap Context */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-700 p-[1px] shadow-lg shadow-amber-900/30">
              <div className="w-full h-full bg-[#120b08] rounded-[11px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> MakeMyMarriage
                </span>
                <span className="text-stone-500">•</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  <span>LIVE BROADCAST</span>
                </div>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-amber-50 tracking-tight mt-0.5">
                {streamData?.title || 'Royal Virtual Mandap & Global Pheras Theatre'}
              </h1>
            </div>
          </div>

          {/* Telemetry Pills & Broadcaster Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Petals Showered Counter Pill */}
            <button
              onClick={triggerPetalShowerBurst}
              className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 hover:border-amber-400 text-amber-200 transition-all shadow-sm cursor-pointer"
              title="Click to shower 50 sacred rose petals!"
            >
              <span className="text-base group-hover:scale-125 transition-transform">🌸</span>
              <span className="text-xs font-semibold">{petalsFormatted} Petals Showered</span>
            </button>

            {/* Global Viewers Metric */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 border border-stone-800 text-stone-300 text-xs">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong className="text-white font-medium">{viewersCount}</strong> Watching
              </span>
            </div>

            {/* Share Mandap Link Button */}
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 text-xs font-medium transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>

            {/* Stream Settings Modal Toggle */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN THEATRE STAGE (VIDEO + RITUALS + GLOBAL DESK) */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ------------------------------------------------------------------- */}
          {/* LEFT COLUMN: 4K MANDAP VIEWPORT + VEDIC RITUAL STEPPER (8 COLS)     */}
          {/* ------------------------------------------------------------------- */}
          <section className="lg:col-span-8 flex flex-col space-y-6">
            {/* Viewport Frame with Multi-Camera Switching & Petals Overlay */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-amber-900/40 shadow-2xl shadow-black/80 flex flex-col group">
              {/* Top Camera Switcher Bar */}
              <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
                <div className="flex items-center space-x-2 pointer-events-auto">
                  <button
                    onClick={() => setActiveCam('cam1')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all backdrop-blur-md flex items-center space-x-1.5 ${
                      activeCam === 'cam1'
                        ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-900/50 border border-amber-400/50'
                        : 'bg-black/60 text-stone-300 hover:bg-black/80 border border-white/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span>Cam 1: Mandap Havankund</span>
                  </button>

                  <button
                    onClick={() => setActiveCam('cam2')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all backdrop-blur-md flex items-center space-x-1.5 ${
                      activeCam === 'cam2'
                        ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-900/50 border border-amber-400/50'
                        : 'bg-black/60 text-stone-300 hover:bg-black/80 border border-white/10'
                    }`}
                  >
                    <span>Cam 2: Royal Wide</span>
                  </button>

                  <button
                    onClick={() => setActiveCam('cam3')}
                    className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-medium transition-all backdrop-blur-md items-center space-x-1.5 ${
                      activeCam === 'cam3'
                        ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-900/50 border border-amber-400/50'
                        : 'bg-black/60 text-stone-300 hover:bg-black/80 border border-white/10'
                    }`}
                  >
                    <span>Cam 3: Jagmandir Drone</span>
                  </button>
                </div>

                {/* Right controls inside viewport */}
                <div className="flex items-center space-x-2 pointer-events-auto">
                  <button
                    onClick={() => setPetalsShowerActive(!petalsShowerActive)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
                      petalsShowerActive
                        ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                        : 'bg-black/60 border-white/10 text-stone-400'
                    }`}
                    title="Toggle Falling Rose Petals"
                  >
                    🌸 {petalsShowerActive ? 'Petals: On' : 'Petals: Off'}
                  </button>
                </div>
              </div>

              {/* 16:9 Video Container with YouTube Live Embed */}
              <div className="relative w-full aspect-video bg-stone-950 overflow-hidden">
                <iframe
                  src={embedUrl}
                  title="Royal Wedding Live Stream"
                  className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                {/* HTML5 Canvas overlay for drifting rose petals & fireworks */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none z-20 w-full h-full"
                />

                {/* Floating Animated Reaction Sprinkles */}
                {floatingReactions.map((r) => (
                  <div
                    key={r.id}
                    style={{ left: `${r.left}%` }}
                    className="absolute bottom-6 pointer-events-none z-30 text-3xl animate-bounce transform -translate-x-1/2 transition-all duration-1000 opacity-90"
                  >
                    {r.char}
                  </div>
                ))}
              </div>

              {/* Bottom Telemetry Bar Inside Viewport */}
              <div className="bg-[#140e0b] border-t border-amber-900/30 px-4 py-3 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center space-x-3 sm:space-x-5">
                  <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>4K UHD • 60 FPS</span>
                  </span>
                  <span className="hidden sm:inline text-stone-500">•</span>
                  <span className="hidden sm:flex items-center space-x-1 text-stone-300">
                    <span>1.2s Ultra-Low Latency</span>
                  </span>
                  <span className="text-amber-300 font-medium truncate max-w-[200px]">
                    {currentWedding?.name || 'Sacred Mandap'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={triggerPetalShowerBurst}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-red-950/40 active:scale-95 transition-all"
                  >
                    <span>🌹</span>
                    <span>Shower Petals (+50)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3. VEDIC RITUAL MILESTONE STEPPER (HORIZONTAL SCROLL)             */}
            {/* ================================================================= */}
            <div className="bg-[#150f0c] border border-amber-900/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h2 className="font-serif text-lg font-bold text-amber-50">
                    Vedic Ceremony Milestones
                  </h2>
                </div>
                <span className="text-xs text-amber-400/80 font-medium">
                  Current: {streamData?.currentRitual || 'Saptapadi (7 Sacred Pheras)'}
                </span>
              </div>

              {/* Milestones horizontal tracker */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {(streamData?.rituals || []).map((rit) => {
                  const isCurrent = rit.status === 'LIVE';
                  const isDone = rit.status === 'COMPLETED';

                  return (
                    <div
                      key={rit.id}
                      onClick={() => handleAdvanceRitual(rit)}
                      className={`relative cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-gradient-to-b from-amber-950/70 to-red-950/50 border-amber-500 shadow-md shadow-amber-900/40 ring-1 ring-amber-400'
                          : isDone
                          ? 'bg-[#1b1410] border-amber-900/40 text-stone-300 hover:border-amber-700/60'
                          : 'bg-[#100b09] border-stone-800 text-stone-500 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-mono text-stone-400">{rit.time}</span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        )}
                        {!isDone && !isCurrent && <Clock className="w-3 h-3 text-stone-600" />}
                      </div>

                      <div className="font-medium text-xs leading-tight mb-2">
                        {rit.name}
                      </div>

                      <div className="text-[10px] uppercase font-bold tracking-wider">
                        {isCurrent && <span className="text-amber-400">● LIVE NOW</span>}
                        {isDone && <span className="text-emerald-400/80">Completed</span>}
                        {!isDone && !isCurrent && <span className="text-stone-600">Upcoming</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================================================================= */}
            {/* 4. SAPTAPADI (7 SACRED PHERAS) INTERACTIVE DEEP DIVE              */}
            {/* ================================================================= */}
            <div className="bg-gradient-to-br from-[#1a110d] via-[#1c130e] to-[#140d0a] border border-amber-700/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Subtle background mandala / sacred flame glow */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-900/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-100">
                      Saptapadi • The Seven Sacred Vows Around Agni
                    </h3>
                    <p className="text-xs text-amber-300/70">
                      Walk step-by-step with the couple through their eternal promises before the sacred fire.
                    </p>
                  </div>
                </div>

                {/* Vow pagination arrows */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSelectVow(Math.max(1, currentVowIndex))}
                    disabled={currentVowIndex === 0}
                    className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-amber-300 px-2 font-medium">
                    Vow {currentVowIndex + 1} of 7
                  </span>
                  <button
                    onClick={() => handleSelectVow(Math.min(7, currentVowIndex + 2))}
                    disabled={currentVowIndex === 6}
                    className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 7 Vow Step Indicator Pills */}
              <div className="flex items-center justify-between my-5 overflow-x-auto py-1 gap-2">
                {SACRED_VOWS.map((vow, idx) => {
                  const isActive = idx === currentVowIndex;
                  const isPast = idx < currentVowIndex;
                  return (
                    <button
                      key={vow.step}
                      onClick={() => handleSelectVow(vow.step)}
                      className={`flex-1 min-w-[70px] py-2 px-2 rounded-xl text-center transition-all border flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-900/50 scale-105'
                          : isPast
                          ? 'bg-amber-950/40 text-amber-200 border-amber-900/40 hover:border-amber-700'
                          : 'bg-[#120b08] text-stone-500 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">Phera {vow.step}</span>
                      <span className="text-[10px] truncate max-w-[80px]">
                        {vow.step === 1
                          ? 'Nourish'
                          : vow.step === 2
                          ? 'Strength'
                          : vow.step === 3
                          ? 'Wealth'
                          : vow.step === 4
                          ? 'Harmony'
                          : vow.step === 5
                          ? 'Family'
                          : vow.step === 6
                          ? 'Health'
                          : 'Unity'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Vow Sacred Sloka & Meaning */}
              <div className="bg-[#120b08] rounded-xl p-5 border border-amber-900/40 relative">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold tracking-wider uppercase mb-2">
                  {activeVow.title}
                </div>

                <blockquote className="font-serif italic text-base sm:text-lg text-amber-100 my-2 leading-relaxed">
                  "{activeVow.sanskrit}"
                </blockquote>

                <p className="text-stone-300 text-sm mt-3 leading-relaxed border-t border-amber-900/20 pt-3">
                  <strong className="text-amber-200 font-medium">Sacred Significance: </strong>
                  {activeVow.meaning}
                </p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: VIRTUAL FAMILY BLESSINGS & LIVE CHAT STREAM (4 COLS)  */}
          {/* ------------------------------------------------------------------- */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            {/* Pinned Grandparents Blessing Card */}
            <div className="bg-gradient-to-br from-[#25150e] via-[#1f120c] to-[#170e0b] border-2 border-amber-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-amber-500/20 text-5xl font-serif select-none pointer-events-none">
                ❞
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Pinned Royal Family Blessing
                </span>
              </div>

              <p className="text-sm font-serif italic text-amber-100 leading-relaxed">
                "{streamData?.pinnedBlessing?.quote ||
                  'May Agni Dev bless our beloved children with boundless love, eternal friendship, and prosperity across oceans!'}"
              </p>

              <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-amber-200 font-semibold block">
                    {streamData?.pinnedBlessing?.author || 'Dadi & Dada'}
                  </strong>
                  <span className="text-stone-400 text-[11px]">
                    {streamData?.pinnedBlessing?.location || 'London, UK'} 🇬🇧
                  </span>
                </div>
                <span className="text-[11px] text-amber-400/80 font-mono">
                  {streamData?.pinnedBlessing?.time || '10m ago'}
                </span>
              </div>
            </div>

            {/* Quick Interactive Emoji Reaction Bar */}
            <div className="bg-[#150f0c] border border-amber-900/30 rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-amber-200/80 font-semibold uppercase tracking-wider block mb-2.5">
                Send Instant Sacred Reaction
              </span>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { char: '🌹', label: 'Petals' },
                  { char: '🪔', label: 'Aarti' },
                  { char: '✨', label: 'Shubh' },
                  { char: '❤️', label: 'Prem' },
                  { char: '🎉', label: 'Badhaai' },
                  { char: '🙏', label: 'Pranam' },
                ].map((item) => (
                  <button
                    key={item.char}
                    onClick={() => handleQuickReaction(item.char)}
                    className="p-2 rounded-xl bg-[#1f1410] hover:bg-amber-900/40 border border-amber-900/40 hover:border-amber-500/50 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                    title={`Send ${item.label}`}
                  >
                    <span className="text-xl group-hover:animate-wiggle">{item.char}</span>
                    <span className="text-[9px] text-stone-400 group-hover:text-amber-200 mt-1">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Chat & Wishes Feed */}
            <div className="bg-[#150f0c] border border-amber-900/30 rounded-2xl p-5 shadow-xl flex flex-col flex-1 min-h-[460px]">
              <div className="flex items-center justify-between pb-3 border-b border-amber-900/30 mb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <h3 className="font-serif text-sm font-bold text-amber-100">
                    Live Virtual Guestbook ({blessingsList.length})
                  </h3>
                </div>
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Live Sync
                </span>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[320px] pr-1 scrollbar-thin scrollbar-thumb-stone-800">
                {blessingsList.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-[#110c09] border border-stone-800/80 my-4">
                    <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-70" />
                    <p className="text-xs font-semibold text-stone-300">No Blessings Posted Yet</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Be the first to send your heartfelt prayers and shower rose petals!
                    </p>
                  </div>
                ) : (
                  blessingsList.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3 text-xs border transition-all ${
                        msg.isFamily
                          ? 'bg-[#1e130e] border-amber-700/40'
                          : 'bg-[#110c09] border-stone-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          <strong className="text-amber-200 font-semibold">{msg.authorName}</strong>
                          {msg.isFamily && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/30">
                              Family
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">{msg.time}</span>
                      </div>

                      <p className="text-stone-300 leading-relaxed">{msg.message}</p>

                      <div className="text-[10px] text-stone-500 mt-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-stone-500" /> {msg.location}
                        </span>
                        <span className="text-amber-400/90 font-medium">+50 🌹</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Send Blessing Form */}
              <form onSubmit={handleSendBlessing} className="pt-4 mt-3 border-t border-amber-900/30 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Suresh Mama)"
                    value={blessingAuthor}
                    onChange={(e) => setBlessingAuthor(e.target.value)}
                    required
                    className="bg-[#110c09] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="City, Country (e.g. Toronto)"
                    value={blessingLocation}
                    onChange={(e) => setBlessingLocation(e.target.value)}
                    className="bg-[#110c09] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Write a heartfelt blessing for the couple..."
                    value={blessingMessage}
                    onChange={(e) => setBlessingMessage(e.target.value)}
                    required
                    className="w-full bg-[#110c09] border border-stone-800 rounded-lg px-2.5 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-1.5 text-[11px] text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFamilyMember}
                      onChange={(e) => setIsFamilyMember(e.target.checked)}
                      className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                    />
                    <span>Immediate Family</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSendingBlessing || !blessingAuthor.trim() || !blessingMessage.trim()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs shadow-md shadow-amber-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingBlessing ? 'Sending...' : 'Bless & Shower Petals'}</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 5. BROADCASTER MASTER CONSOLE & GLOBAL DEMOGRAPHICS CARD                 */}
        {/* ========================================================================= */}
        <div className="mt-8 bg-[#140e0b] border border-amber-900/30 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-amber-900/30 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Radio className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-amber-100">
                  Broadcaster Master Console & Global Diaspora Telemetry
                </h3>
                <p className="text-xs text-stone-400">
                  Live transcode health, YouTube RTMP ingestion endpoint, and global family connections.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-stone-400 font-mono">
                Stream Privacy: <strong className="text-amber-300">{streamData?.telemetry?.privacy || 'PUBLIC'}</strong>
              </span>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors"
              >
                Configure Keys
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
            <div className="bg-[#110c09] p-3.5 rounded-xl border border-stone-800">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                🇺🇸 United States
              </div>
              <div className="text-lg font-bold text-amber-200">
                {streamData?.telemetry?.viewerBreakdown?.us ?? 0} Guests
              </div>
              <div className="text-[10px] text-stone-400">New York, Bay Area, Austin</div>
            </div>

            <div className="bg-[#110c09] p-3.5 rounded-xl border border-stone-800">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                🇬🇧 United Kingdom
              </div>
              <div className="text-lg font-bold text-amber-200">
                {streamData?.telemetry?.viewerBreakdown?.uk ?? 0} Guests
              </div>
              <div className="text-[10px] text-stone-400">London, Leicester, Birmingham</div>
            </div>

            <div className="bg-[#110c09] p-3.5 rounded-xl border border-stone-800">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                🇨🇦 Canada
              </div>
              <div className="text-lg font-bold text-amber-200">
                {streamData?.telemetry?.viewerBreakdown?.ca ?? 0} Guests
              </div>
              <div className="text-[10px] text-stone-400">Toronto, Vancouver, Brampton</div>
            </div>

            <div className="bg-[#110c09] p-3.5 rounded-xl border border-stone-800">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                🇦🇪 United Arab Emirates
              </div>
              <div className="text-lg font-bold text-amber-200">
                {streamData?.telemetry?.viewerBreakdown?.ae ?? 0} Guests
              </div>
              <div className="text-[10px] text-stone-400">Dubai Marina, Abu Dhabi</div>
            </div>

            <div className="bg-[#110c09] p-3.5 rounded-xl border border-stone-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                🇮🇳 Domestic India
              </div>
              <div className="text-lg font-bold text-amber-200">
                {streamData?.telemetry?.viewerBreakdown?.in ?? 0} Guests
              </div>
              <div className="text-[10px] text-stone-400">Delhi, Mumbai, Bengaluru</div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. BROADCASTER SETTINGS MODAL                                            */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#170f0b] border border-amber-900/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-stone-200">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-amber-50">
                  Broadcast Stream Configuration
                </h3>
                <p className="text-xs text-stone-400">
                  Update your YouTube Live URL, stream title, and access passcode.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">
                  Ceremony Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full bg-[#110c09] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">
                  YouTube Live / Video URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={formStreamUrl}
                  onChange={(e) => setFormStreamUrl(e.target.value)}
                  required
                  className="w-full bg-[#110c09] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Paste regular YouTube watch links, Live links, or embed URLs. The player transforms them automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Privacy Mode
                  </label>
                  <select
                    value={formPrivacy}
                    onChange={(e) => setFormPrivacy(e.target.value as any)}
                    className="w-full bg-[#110c09] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PUBLIC">Public to All Guests</option>
                    <option value="PRIVATE">Passcode Protected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    Access Passcode
                  </label>
                  <input
                    type="text"
                    value={formPasscode}
                    onChange={(e) => setFormPasscode(e.target.value)}
                    className="w-full bg-[#110c09] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-amber-900/30 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs shadow-lg shadow-amber-950/50 disabled:opacity-50 transition-all"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Stream Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamBroadcastView;
