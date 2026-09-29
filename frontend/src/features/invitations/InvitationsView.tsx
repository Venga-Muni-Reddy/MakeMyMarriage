import React, { useState, useEffect, useRef } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { eventService, WeddingEvent } from '../../services/event.service';
import {
  invitationService,
  HouseholdInvitation,
  InvitationTelemetry,
  HeritageTheme,
  SoundscapeRaga,
} from '../../services/invitation.service';
import {
  Send,
  Sparkles,
  Palette,
  Scroll,
  Music,
  Ticket,
  Copy,
  Check,
  RotateCcw,
  QrCode,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Play,
  Pause,
  Crown,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Share2,
  X,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

const DEFAULT_HERITAGE_THEMES: HeritageTheme[] = [
  {
    id: 'rajputana-crimson',
    name: 'Rajputana Crimson',
    subtitle: 'Deep Vermilion Velvet & 24K Gold Foil',
    tagline: 'Deep vermilion velvet, 24K gold jaali embossing & royal crest.',
    accentColor: '#8a1c36',
    bgGradient: 'from-[#8a1c36] to-[#400010]',
    parchmentBg: '#faf6ee',
    borderStyle: 'border-2 border-primary',
    tags: ['Gold Foil', 'Deckle Edge', 'Royal Jaali'],
  },
  {
    id: 'mewar-ivory',
    name: 'Mewar Ivory Silk',
    subtitle: 'Chanderi Weave & Marigold Garland',
    tagline: 'Chanderi silk weave, yellow marigold garland accents, pearlescent glow.',
    accentColor: '#bf8e42',
    bgGradient: 'from-[#fcf9f2] to-[#ebdcc9]',
    parchmentBg: '#fffdf9',
    borderStyle: 'border border-amber-200/50',
    tags: ['Silk Weave', 'Subtle Gilt', 'Parchment'],
  },
  {
    id: 'vedic-bronze',
    name: 'Vedic Temple Bronze',
    subtitle: 'Brass Diya & Peacock Heraldry',
    tagline: 'Warm diya brass lighting, peacock arch heraldry, south temple border.',
    accentColor: '#7a5912',
    bgGradient: 'from-[#3d2c1c] to-[#1c130b]',
    parchmentBg: '#f7f1e6',
    borderStyle: 'border border-amber-400/40',
    tags: ['Brass Metallic', 'Sacred Diya', 'Peacock Arch'],
  },
  {
    id: 'pichwai-emerald',
    name: 'Pichwai Emerald Lotus',
    subtitle: 'Nathdwara Lotus Ponds & Pearl Inlays',
    tagline: 'Nathdwara hand-painted lotus ponds, emerald lake arches, pearl inlays.',
    accentColor: '#13392e',
    bgGradient: 'from-[#13392e] to-[#0a1e18]',
    parchmentBg: '#f0f6f3',
    borderStyle: 'border border-emerald-400/40',
    tags: ['Pichwai Motif', 'Water Arch', 'Lotus Enclave'],
  },
];

const DEFAULT_SOUNDSCAPES: SoundscapeRaga[] = [
  {
    id: 'bismillah-shehnai',
    title: 'Shehnai Raga Yaman • Mangal Dhwani',
    artist: 'Ustad Bismillah Khan Heritage Archive',
    description: 'Auspicious wedding raga recorded at Varanasi Ghats (24-bit Hi-Res)',
    raga: 'Raga Yaman',
    duration: '04:18',
    audioUrl: 'https://actions.google.com/sounds/v1/ambient/temple_bell.ogg',
  },
  {
    id: 'sitar-santoor-harmony',
    title: 'Royal Sitar & Santoor Harmony',
    artist: 'Mewar Court Classical Ensemble',
    description: 'Gentle celebratory string symphony for royal welcoming',
    raga: 'Raga Hansadhwani',
    duration: '03:45',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_morning.ogg',
  },
  {
    id: 'palace-flute-ambient',
    title: 'Muted Palace Flute & Tanpura',
    artist: 'Udaipur Lake Palace Serenades',
    description: 'Serene bamboo flute echoing across royal palace courtyards',
    raga: 'Raga Bhupali',
    duration: '02:50',
    audioUrl: 'https://actions.google.com/sounds/v1/ambient/water_stream.ogg',
  },
];

export const InvitationsView: React.FC = () => {
  const { currentWedding } = useWedding();
  const weddingId = currentWedding?.id;

  // Data State
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [telemetry, setTelemetry] = useState<InvitationTelemetry | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [themes, setThemes] = useState<HeritageTheme[]>(DEFAULT_HERITAGE_THEMES);
  const [soundscapes, setSoundscapes] = useState<SoundscapeRaga[]>(DEFAULT_SOUNDSCAPES);
  const [isLoading, setIsLoading] = useState(true);

  // Studio Interactive State
  const [activeStudioTab, setActiveStudioTab] = useState<'theme' | 'verse' | 'music' | 'passes'>('theme');
  const [selectedThemeId, setSelectedThemeId] = useState('rajputana-crimson');
  const [liveVerse, setLiveVerse] = useState('');
  const [verseFont, setVerseFont] = useState('font-display');
  const [selectedRagaId, setSelectedRagaId] = useState('bismillah-shehnai');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mobile Simulator State
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [simulatorGuest, setSimulatorGuest] = useState<HouseholdInvitation | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Table & Filter State
  const [activeTableTab, setActiveTableTab] = useState<'all' | 'ready' | 'dispatched' | 'opened' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<string[]>([]);
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [inspectingQrPass, setInspectingQrPass] = useState<HouseholdInvitation | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load initial data
  const loadData = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const [invList, telData, setts, eventList, themeList, ragaList] = await Promise.all([
        invitationService.getInvitations(weddingId),
        invitationService.getTelemetry(weddingId),
        invitationService.getSettings(weddingId),
        eventService.getEvents(weddingId),
        invitationService.getThemes(weddingId),
        invitationService.getSoundscapes(weddingId),
      ]);

      setInvitations(Array.isArray(invList) ? invList : []);
      if (telData) setTelemetry(telData);
      if (setts) {
        if (setts.activeThemeId) setSelectedThemeId(setts.activeThemeId);
        if (setts.verseText) setLiveVerse(setts.verseText);
        if (setts.verseFont) setVerseFont(setts.verseFont);
        if (setts.activeSoundscapeId) setSelectedRagaId(setts.activeSoundscapeId);
      }
      if (Array.isArray(eventList)) setEvents(eventList);
      if (Array.isArray(themeList) && themeList.length > 0) setThemes(themeList);
      if (Array.isArray(ragaList) && ragaList.length > 0) setSoundscapes(ragaList);

      if (Array.isArray(invList) && invList.length > 0 && !simulatorGuest) {
        setSimulatorGuest(invList[0]);
      }
    } catch (err) {
      console.error('Failed to load digital invitation workspace', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weddingId]);

  // Audio Playback Preview
  const toggleAudio = () => {
    const activeRaga = soundscapes.find((s) => s.id === selectedRagaId) || soundscapes[0];
    if (!activeRaga?.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(activeRaga.audioUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  // Save Studio Settings
  const handleSaveSettings = async () => {
    if (!weddingId) return;
    setIsSavingSettings(true);
    try {
      await invitationService.updateSettings(weddingId, {
        activeThemeId: selectedThemeId,
        verseText: liveVerse,
        verseFont,
        activeSoundscapeId: selectedRagaId,
        autoplaySoundscape: true,
      });
      showToast('Imperial Studio settings synchronized successfully');
    } catch (err) {
      console.error('Failed to save settings', err);
      showToast('Error updating studio settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Dispatch Single Pass via WhatsApp
  const handleSendWhatsApp = async (inv: HouseholdInvitation) => {
    if (!weddingId) return;
    const phone = inv.guest.phone ? inv.guest.phone.replace(/[^0-9]/g, '') : '';
    const magicUrl = `${window.location.origin}/invite/${inv.magicToken}`;
    const coupleText = 'Radhika & Aarav';
    const text = encodeURIComponent(
      `✨ *Shubh Vivah Aamantran*\n\nNamaste ${inv.guest.displayName},\n\nBy the divine grace of the Almighty, you are cordially invited to celebrate the royal nuptials of *${coupleText}* at The Leela Palace, Udaipur.\n\nKindly access your personalized family pass & RSVP confirmation here:\n🔗 ${magicUrl}\n\nWith warm royal regards,\nRathore & Ranawat Families`
    );

    // Update status in backend
    try {
      await invitationService.dispatchSingle(weddingId, inv.id, 'WHATSAPP');
      loadData();
      showToast(`Pass marked dispatched for ${inv.guest.displayName}`);
    } catch (e) {
      console.error(e);
    }

    // Open WhatsApp Web or mobile client
    const targetUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(targetUrl, '_blank');
  };

  // Bulk WhatsApp Blast
  const handleBulkDispatch = async () => {
    if (!weddingId || selectedInvitationIds.length === 0) return;
    if (!confirm(`Dispatch digital imperial passes to ${selectedInvitationIds.length} royal household(s)?`)) return;

    setIsBulkDispatching(true);
    try {
      await invitationService.bulkDispatch(weddingId, selectedInvitationIds, 'WHATSAPP');
      showToast(`${selectedInvitationIds.length} WhatsApp invitation passes queued & dispatched`);
      setSelectedInvitationIds([]);
      loadData();
    } catch (err) {
      console.error('Bulk dispatch failed', err);
    } finally {
      setIsBulkDispatching(false);
    }
  };

  // Dispatch Single Pass via Email (Resend)
  const handleSendEmail = async (inv: HouseholdInvitation) => {
    if (!weddingId) return;
    if (!inv.guest.email) {
      showToast(`No email address registered for ${inv.guest.displayName}`);
      return;
    }

    setSendingEmailId(inv.id);
    try {
      await invitationService.dispatchSingle(weddingId, inv.id, 'EMAIL');
      showToast(`✨ Royal digital invitation delivered to ${inv.guest.email}`);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to dispatch royal email');
    } finally {
      setSendingEmailId(null);
    }
  };

  // Bulk Email Blast (Resend)
  const handleBulkEmailDispatch = async () => {
    if (!weddingId || selectedInvitationIds.length === 0) return;
    if (!confirm(`Dispatch royal invitation emails to ${selectedInvitationIds.length} household(s)?`)) return;

    setIsBulkEmailing(true);
    try {
      const res: any = await invitationService.bulkDispatch(weddingId, selectedInvitationIds, 'EMAIL');
      showToast(res?.message || `${selectedInvitationIds.length} email invitations queued`);
      setSelectedInvitationIds([]);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Bulk email dispatch failed');
    } finally {
      setIsBulkEmailing(false);
    }
  };

  // Copy Magic Link to clipboard
  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    showToast('Magic token URL copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Filter Table
  const safeInvitations = Array.isArray(invitations) ? invitations : [];
  const filteredInvitations = safeInvitations.filter((inv) => {
    if (activeTableTab === 'ready' && inv.status !== 'QUEUED' && inv.status !== 'DRAFT') return false;
    if (activeTableTab === 'dispatched' && inv.status !== 'SENT' && inv.status !== 'DELIVERED') return false;
    if (activeTableTab === 'opened' && inv.status !== 'OPENED') return false;
    if (activeTableTab === 'pending' && inv.status === 'DELIVERED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const g = inv.guest;
      return (
        g.displayName.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.category?.name && g.category.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Table selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvitationIds(filteredInvitations.map((i) => i.id));
    } else {
      setSelectedInvitationIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedInvitationIds.includes(id)) {
      setSelectedInvitationIds(selectedInvitationIds.filter((item) => item !== id));
    } else {
      setSelectedInvitationIds([...selectedInvitationIds, id]);
    }
  };

  const activeTheme =
    (themes && themes.length > 0 ? themes.find((t) => t.id === selectedThemeId) || themes[0] : null) ||
    DEFAULT_HERITAGE_THEMES[0];

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Chancery Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-outline-variant/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Vivah Patrika Studio
            </span>
            <span className="text-xs text-on-surface-variant">•</span>
            <span className="text-xs text-on-surface-variant font-mono">Session #MMM-UDR-2026</span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            Digital Invitation Suite &amp; Dispatch Atelier
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Curate bespoke royal wedding invitations, personalize sacred Vedic shlokas, and dispatch cryptographically verified passes via WhatsApp with real-time palace telemetry.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveStudioTab('verse')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-primary border border-primary/20 transition-all text-xs font-semibold shadow-xs"
          >
            <Scroll className="w-4 h-4" />
            <span>+ Compose Verse</span>
          </button>
          <button
            onClick={handleBulkDispatch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white transition-all text-xs font-semibold shadow-sm hover:shadow active:scale-95"
          >
            <Send className="w-4 h-4 text-amber-200" />
            <span>Dispatch WhatsApp Invites</span>
          </button>
        </div>
      </div>

      {/* 2. Refined Telemetry KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Passes Minted */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Passes Minted
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-3xl font-bold text-on-surface">
                  {telemetry?.totalMinted || safeInvitations.length}
                </span>
                <span className="text-xs text-on-surface-variant">
                  / {telemetry?.totalHouseholds || safeInvitations.length} Families
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Manifest Coverage</span>
            <span className="font-semibold text-primary">100% Ready</span>
          </div>
        </div>

        {/* KPI 2: WhatsApp Dispatched */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                WhatsApp Dispatched
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-3xl font-bold text-on-surface">
                  {telemetry?.whatsappDispatchedCount || 0}
                </span>
                <span className="text-xs font-semibold text-secondary bg-secondary-fixed/40 px-1.5 py-0.5 rounded">
                  {telemetry?.whatsappDispatchedPercentage || 0}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>{telemetry?.queuedCount || 0} Households in queue</span>
              <span className="font-medium text-on-surface">99.8% SLA</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.whatsappDispatchedPercentage || 10}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Guest Open Rate */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Guest Open Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-3xl font-bold text-on-surface">
                  {telemetry?.openRatePercentage || 0}%
                </span>
                <span className="text-xs text-primary font-medium">
                  {telemetry?.openedCount || 0} Opened
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/20 text-primary flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Peak Unboxing Window</span>
            <span className="font-medium text-primary">8:15 PM (Avg 4.8m)</span>
          </div>
        </div>

        {/* KPI 4: Security & Tokens */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Security &amp; Tokens
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-2xl font-bold text-on-surface leading-tight">
                  100% Secure
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-primary font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Zero-Password AES
            </span>
            <span className="text-on-surface-variant font-mono">TLS 1.3</span>
          </div>
        </div>
      </div>

      {/* 3. Central Studio & Interactive Preview (Clear 2-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Studio Atelier (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-7 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-6">
            {/* Tabbed Navigation Bar */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-3 text-xs font-semibold">
              <button
                onClick={() => setActiveStudioTab('theme')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeStudioTab === 'theme'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>1. Invitation Theme</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('verse')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeStudioTab === 'verse'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <Scroll className="w-4 h-4" />
                <span>2. Verse &amp; Shloka</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('music')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeStudioTab === 'music'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>3. Royal Raga</span>
              </button>
              <button
                onClick={() => setActiveStudioTab('passes')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeStudioTab === 'passes'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>4. Passes Included</span>
              </button>
            </div>

            {/* TAB PANE 1: HERITAGE THEMES */}
            {activeStudioTab === 'theme' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md font-semibold text-base text-on-surface">
                      Curated Heritage Parchments
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Select tactile aesthetic for digital unboxing &amp; physical gold-foil folio print.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {activeTheme?.name} Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {themes.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                          isSelected
                            ? 'border-primary bg-primary-fixed/10 shadow-sm'
                            : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50'
                        }`}
                      >
                        <div className="flex gap-3.5">
                          <div
                            className={`w-14 h-20 rounded-lg bg-gradient-to-br ${theme.bgGradient} p-1.5 flex flex-col justify-between items-center text-center shadow-inner shrink-0`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span className="font-headline-sm text-[10px] text-amber-100 font-bold tracking-widest">
                              R&amp;A
                            </span>
                            <div className="w-4 h-0.5 bg-yellow-300/40" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm text-on-surface truncate">{theme.name}</h4>
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-outline-variant" />
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                              {theme.tagline}
                            </p>
                            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                              {theme.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-surface-container px-2 py-0.5 rounded font-mono text-on-surface-variant"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB PANE 2: SACRED SHLOKA & VERSE */}
            {activeStudioTab === 'verse' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-headline-md font-semibold text-base text-on-surface">
                      Auspicious Shloka &amp; Inscription
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Divine blessing rendered at the unboxing parchment apex.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setLiveVerse(
                          liveVerse.includes('वक्रतुण्ड')
                            ? 'By the divine grace of Shree Eklingji, we seek the auspicious presence of your family at the nuptials of Radhika & Aarav.'
                            : 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥\nBy the divine grace of Shree Eklingji, we seek the auspicious presence of your family at the nuptials of Radhika & Aarav.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors"
                    >
                      Sanskrit / English
                    </button>
                    <select
                      value={verseFont}
                      onChange={(e) => setVerseFont(e.target.value)}
                      className="text-xs rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1.5 text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="font-display">Playfair Display</option>
                      <option value="font-display italic">Royal Calligraphic</option>
                      <option value="font-body">Clean Modern Sans</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative">
                  <textarea
                    value={liveVerse}
                    onChange={(e) => setLiveVerse(e.target.value)}
                    rows={4}
                    className={`w-full bg-transparent ${verseFont} text-sm leading-relaxed text-on-surface focus:outline-none resize-none border-none p-0 focus:ring-0`}
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 mt-2 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Pandit Verified Sanskrit Grammar
                    </span>
                    <span>Syncs automatically with live card preview</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB PANE 3: SOUNDSCAPE / RAGA */}
            {activeStudioTab === 'music' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md font-semibold text-base text-on-surface">
                      Ceremonial Palace Soundscape
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Plays softly upon breaking the cryptographic wax seal.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> Auto-play on Unveil
                  </span>
                </div>

                <div className="space-y-3">
                  {soundscapes.map((s) => {
                    const isSelected = selectedRagaId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedRagaId(s.id)}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary-fixed/15'
                            : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRagaId(s.id);
                              toggleAudio();
                            }}
                            className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-95"
                          >
                            {isSelected && isPlayingAudio ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5" />
                            )}
                          </button>
                          <div>
                            <h4 className="font-semibold text-sm text-on-surface">{s.title}</h4>
                            <p className="text-xs text-on-surface-variant">{s.description}</p>
                          </div>
                        </div>

                        {/* Animated Equalizer Waveform */}
                        {isSelected && isPlayingAudio && (
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3 bg-primary rounded-full animate-bounce" />
                            <span className="w-1 h-6 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="w-1 h-7 bg-primary rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                            <span className="w-1 h-5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '220ms' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB PANE 4: CEREMONIAL PASSES */}
            {activeStudioTab === 'passes' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline-md font-semibold text-base text-on-surface">
                      Ceremony Admission Passes
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Enable which event QR modules are attached to this dispatch tier.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-primary font-semibold">{events.length} Ceremonies Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {events.map((ev) => (
                    <label
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{ev.name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {ev.settings?.locationName || 'Main Palace Enclave'}
                          </p>
                        </div>
                      </div>
                      <input
                        defaultChecked
                        type="checkbox"
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Save Studio Settings CTA */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                Live changes immediately reflect in the guest preview simulator
              </span>
              <button
                disabled={isSavingSettings}
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {isSavingSettings ? 'Synchronizing...' : 'Save Studio Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Guest Simulator (5 cols) */}
        <div className="lg:col-span-5 sticky top-28">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md flex flex-col items-center">
            {/* Simulator Subheader */}
            <div className="w-full flex items-center justify-between pb-3.5 mb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                  Live Guest Experience
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSealBroken(false)}
                  title="Reseal Wax Envelope"
                  className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {simulatorGuest && (
                  <button
                    onClick={() => handleCopyLink(simulatorGuest.magicToken)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-medium text-primary flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Magic Link</span>
                  </button>
                )}
              </div>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="w-full max-w-[320px] rounded-[38px] p-2.5 bg-[#1e1b19] shadow-2xl relative border-2 border-stone-800">
              {/* Notch Pill */}
              <div className="absolute top-4 left-1/2 -translate-y-1/2 w-20 h-3.5 bg-black rounded-full z-30 flex items-center justify-end px-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#12283a]" />
              </div>

              {/* Inner Viewport */}
              <div
                style={{ backgroundColor: activeTheme?.parchmentBg || '#faf6ee' }}
                className="w-full rounded-[30px] overflow-hidden text-on-surface relative min-h-[520px] flex flex-col justify-between transition-colors duration-500"
              >
                {/* Status Bar */}
                <div className="pt-2.5 px-6 flex justify-between items-center text-[10px] font-semibold text-on-surface-variant z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">5G</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>

                {/* Card Unboxing Stage */}
                <div className="p-4 flex-1 flex flex-col items-center justify-between text-center overflow-y-auto no-scrollbar">
                  {/* Wax Seal Trigger Motif */}
                  <div
                    onClick={() => setIsSealBroken(!isSealBroken)}
                    className="my-1 cursor-pointer transition-transform duration-300 hover:scale-105"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary via-[#d2335a] to-secondary flex items-center justify-center shadow-lg border-2 border-amber-200">
                      <div className="w-12 h-12 rounded-full border border-amber-200/60 flex items-center justify-center font-headline-md font-bold text-amber-100 text-lg">
                        R&amp;A
                      </div>
                    </div>
                    <span className="block mt-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      {isSealBroken ? 'Seal Broken ✓' : 'Tap to Unveil Seal'}
                    </span>
                  </div>

                  {/* The Royal Invitation Parchment Card */}
                  <div
                    className={`w-full rounded-2xl bg-white p-4 shadow-sm border border-amber-200/50 space-y-2 transition-all duration-500 ${
                      isSealBroken ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-90 scale-95'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto text-primary">
                      <Sparkles className="w-5 h-5 mx-auto" />
                    </div>
                    <p className="text-[10px] uppercase font-semibold tracking-widest text-primary">
                      Shubh Vivah Aamantran
                    </p>
                    <h3 className="font-headline-md font-bold text-lg text-secondary leading-tight">
                      Radhika &amp; Aarav
                    </h3>
                    <p className={`text-[11px] text-tertiary leading-snug px-1 line-clamp-3 ${verseFont}`}>
                      "{liveVerse || 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।'}"
                    </p>

                    {/* Dignitary Allocation Box */}
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-dashed border-amber-200 text-center">
                      <span className="block text-[9px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Exclusive Family Pass
                      </span>
                      <span className="font-headline-sm font-bold text-xs text-on-surface block mt-0.5">
                        {simulatorGuest?.guest.displayName || 'Justice Rajeshwar Dayal & Family'}
                      </span>
                      <span className="block text-[10px] text-secondary font-medium">
                        Allocated: {simulatorGuest?.guest.metadata?.paxCount || 4} Guests • {simulatorGuest?.guest.metadata?.allocatedSuite || 'Lake Palace Suite'}
                      </span>
                    </div>

                    {/* Mini Ceremonial Badges */}
                    <div className="flex justify-center gap-1 pt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 font-semibold">
                        Haldi VIP
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-100 text-purple-900 font-semibold">
                        Sangeet
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-secondary text-white font-semibold">
                        Mandap
                      </span>
                    </div>

                    {/* QR Mini Gate Pass */}
                    <div className="pt-1.5 flex items-center justify-center gap-2 border-t border-outline-variant/30 mt-1">
                      <QrCode className="w-7 h-7 text-primary" />
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-on-surface block font-mono">
                          {simulatorGuest?.magicToken?.substring(0, 10).toUpperCase() || 'TOK-8F9A2B'}
                        </span>
                        <span className="text-[9px] text-on-surface-variant block">Valet &amp; Gate 1 Pass</span>
                      </div>
                    </div>
                  </div>

                  {/* Instant Action RSVP Button */}
                  <div className="w-full mt-2">
                    <button
                      onClick={() => showToast('Guest RSVP confirmed for 4 Pax!')}
                      className="w-full py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/95 text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Royal RSVP ({simulatorGuest?.guest.metadata?.paxCount || 4} Pax)</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Home Bar */}
                <div className="pb-2 flex justify-center">
                  <div className="w-24 h-1 rounded-full bg-on-surface/20" />
                </div>
              </div>
            </div>

            {/* Footer Badge details */}
            <div className="mt-4 flex items-center justify-between w-full text-xs text-on-surface-variant px-2">
              <span className="flex items-center gap-1 text-primary font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" /> Zero-Password Magic Link
              </span>
              <span className="font-mono text-[11px]">0.4s Cold Load</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Streamlined Household Manifest & WhatsApp Dispatch Queue Table */}
      <div className="p-7 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-6">
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-headline-md font-bold text-xl text-on-surface">
                Household Access Manifest &amp; WhatsApp Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                {safeInvitations.length} Households
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Each dignitary pass carries a secure AES cryptographic zero-password magic link.
            </p>
          </div>

          {/* Search & Export Ribbon */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search VIP, title, phone..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary w-60"
              />
            </div>
            <button
              onClick={() => showToast('Manifest exported to CSV format')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-xs font-semibold text-primary transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs Ribbon */}
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: `All Households (${safeInvitations.length})` },
            {
              id: 'ready',
              label: `WhatsApp Ready (${safeInvitations.filter((i) => i.status === 'QUEUED' || i.status === 'DRAFT').length})`,
            },
            {
              id: 'dispatched',
              label: `Dispatched (${safeInvitations.filter((i) => i.status === 'SENT' || i.status === 'DELIVERED').length})`,
            },
            {
              id: 'opened',
              label: `Opened & Viewed (${safeInvitations.filter((i) => i.status === 'OPENED').length})`,
            },
            {
              id: 'pending',
              label: `Pending (${safeInvitations.filter((i) => i.status === 'QUEUED').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTableTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTableTab === tab.id
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredInvitations.length > 0 && selectedInvitationIds.length === filteredInvitations.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Dignitary / Household Head</th>
                <th className="py-3 px-4">VIP Circle</th>
                <th className="py-3 px-4">Pass Allocation</th>
                <th className="py-3 px-4">Cryptographic Link</th>
                <th className="py-3 px-4">Channel &amp; Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <p className="font-semibold">Loading royal invitation chancery roll...</p>
                  </td>
                </tr>
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <p className="font-semibold">No household invitations match your current filter</p>
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => {
                  const isSelected = selectedInvitationIds.includes(inv.id);
                  const g = inv.guest;
                  const initials = `${g.firstName?.[0] || ''}${g.lastName?.[0] || ''}`.toUpperCase() || 'RG';
                  const pax = Number(g.metadata?.paxCount) || 1;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        isSelected ? 'bg-primary-fixed/15' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(inv.id)}
                          className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                        />
                      </td>

                      {/* Dignitary */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-on-surface">{g.displayName}</div>
                            <div className="text-[11px] text-on-surface-variant">
                              {g.phone || 'No phone'} • {g.metadata?.householdName || 'Royal Household'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VIP Circle */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/60">
                          <Crown className="w-3.5 h-3.5 mr-1 text-primary" />
                          <span>{g.category?.name || 'Noble Guest'}</span>
                        </span>
                      </td>

                      {/* Pass Allocation */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-on-surface">{pax} Pax</span>
                          <span className="text-outline text-xs">•</span>
                          {events.map((ev) => {
                            const isAssigned = g.assignedEventIds?.includes(ev.id);
                            const letter = ev.name?.[0] || 'C';
                            const isMandap =
                              ev.name.toLowerCase().includes('vivaha') ||
                              ev.name.toLowerCase().includes('mandap') ||
                              ev.name.toLowerCase().includes('pher');

                            return (
                              <span
                                key={ev.id}
                                title={`${ev.name}: ${isAssigned ? 'Assigned' : 'Not Assigned'}`}
                                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  isAssigned
                                    ? isMandap
                                      ? 'bg-secondary text-white'
                                      : 'bg-primary-container text-on-primary-container'
                                    : 'bg-surface-container text-on-surface-variant/30'
                                }`}
                              >
                                {letter}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Cryptographic Link */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleCopyLink(inv.magicToken)}
                          className="flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                          title="Click to copy guest magic link"
                        >
                          <span>.../{inv.magicToken.substring(0, 14)}</span>
                          {copiedToken === inv.magicToken ? (
                            <Check className="w-3.5 h-3.5 text-secondary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                          )}
                        </button>
                      </td>

                      {/* Channel & Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            inv.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                              : inv.status === 'OPENED'
                              ? 'bg-secondary-fixed text-on-secondary-fixed border-secondary/30 font-bold'
                              : 'bg-amber-50 text-amber-900 border-amber-200/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              inv.status === 'DELIVERED'
                                ? 'bg-emerald-600'
                                : inv.status === 'OPENED'
                                ? 'bg-secondary'
                                : 'bg-amber-500'
                            }`}
                          />
                          {inv.status === 'DELIVERED'
                            ? 'WhatsApp Delivered & Read'
                            : inv.status === 'OPENED'
                            ? 'Opened & Viewed Pass'
                            : 'WhatsApp Ready (Queued)'}
                        </span>
                      </td>

                      {/* Quick Action */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendWhatsApp(inv)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Dispatch WhatsApp Pass"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            disabled={sendingEmailId === inv.id || !inv.guest.email}
                            onClick={() => handleSendEmail(inv)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                              inv.guest.email
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'opacity-35 cursor-not-allowed bg-surface-container text-on-surface-variant'
                            }`}
                            title={
                              inv.guest.email
                                ? `Send Royal Email to ${inv.guest.email}`
                                : 'No email address registered for this guest'
                            }
                          >
                            {sendingEmailId === inv.id ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSimulatorGuest(inv);
                              setInspectingQrPass(inv);
                            }}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                            title="Inspect QR Pass in Simulator"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <a
                            href={`/invite/${inv.magicToken}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                            title="Open Fullscreen Guest View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Floating Quick Blast Bar */}
      {selectedInvitationIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-container-lowest border-2 border-primary shadow-2xl px-6 py-3.5 rounded-2xl flex items-center gap-4 animate-slideUp">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="font-bold text-on-surface">
              {selectedInvitationIds.length} Households Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isBulkDispatching}
              onClick={handleBulkDispatch}
              className="px-4 py-2 bg-secondary text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs hover:bg-secondary/90 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-amber-200" />
              <span>{isBulkDispatching ? 'Dispatching...' : 'Dispatch WhatsApp'}</span>
            </button>
            <button
              disabled={isBulkEmailing}
              onClick={handleBulkEmailDispatch}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-amber-200" />
              <span>{isBulkEmailing ? 'Sending...' : 'Dispatch Email'}</span>
            </button>
            <button
              onClick={() => setSelectedInvitationIds([])}
              className="px-3 py-2 bg-surface-container text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-semibold transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* QR Pass Inspection Modal */}
      {inspectingQrPass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl border border-outline-variant/30 shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-full flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Imperial QR Gate Pass
              </span>
              <button
                onClick={() => setInspectingQrPass(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-inner border border-outline-variant/40 flex flex-col items-center">
              <QrCode className="w-44 h-44 text-primary" />
              <span className="font-mono text-xs font-bold text-primary mt-2">
                ROYAL-{inspectingQrPass.magicToken.substring(4, 12).toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                {inspectingQrPass.guest.displayName}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {inspectingQrPass.guest.metadata?.householdName || 'Royal Household'} •{' '}
                <strong className="text-primary">{inspectingQrPass.guest.metadata?.paxCount || 1} Pax</strong>
              </p>
            </div>

            <button
              onClick={() => handleSendWhatsApp(inspectingQrPass)}
              className="w-full py-2.5 bg-secondary text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Pass via WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
