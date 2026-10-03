import React, { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import {
  notificationService,
  NotificationItem,
  NotificationTelemetry,
  TriggerSettings,
  BroadcastPayload,
} from '../../services/notification.service';
import {
  Send,
  MessageSquare,
  Mail,
  ShieldCheck,
  Sparkles,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  RotateCw,
  Sliders,
  X,
  Crown,
  Bell,
  Check,
} from 'lucide-react';

export const NotificationHubView: React.FC = () => {
  const { currentWedding } = useWedding();
  const weddingId = currentWedding?.id;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [telemetry, setTelemetry] = useState<NotificationTelemetry | null>(null);
  const [triggers, setTriggers] = useState<TriggerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Broadcast Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [broadcastData, setBroadcastData] = useState<BroadcastPayload>({
    segment: 'ALL_GUESTS',
    channel: 'BOTH',
    subject: `👑 Wedding Update: ${currentWedding?.name || 'Wedding Celebrations'}`,
    message:
      'We eagerly await your gracious presence at our wedding celebrations. Kindly review your digital pass for ceremonial schedules and event details.',
    ceremonyScope: 'All Ceremonies',
  });

  useEffect(() => {
    if (currentWedding?.name) {
      setBroadcastData((prev) => ({
        ...prev,
        subject: `👑 Wedding Update: ${currentWedding.name}`,
        message: `We eagerly await your gracious presence to celebrate ${currentWedding.name}. Kindly review your digital pass for ceremonial schedules and event details.`,
        ceremonyScope: 'All Ceremonies',
      }));
    }
  }, [currentWedding?.name]);

  // Triggering countdown alerts
  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const [notifsData, telData, triggersData] = await Promise.all([
        notificationService.getNotifications(weddingId),
        notificationService.getTelemetry(weddingId),
        notificationService.getTriggerSettings(weddingId),
      ]);
      setNotifications(notifsData);
      setTelemetry(telData);
      setTriggers(triggersData);
    } catch (err: any) {
      console.error('Failed to load notifications hub', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weddingId]);

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId) return;

    setIsSubmittingBroadcast(true);
    try {
      const res = await notificationService.broadcast(weddingId, broadcastData);
      showToast(
        `✦ Broadcast dispatched: ${res.dispatchedCount} notifications sent across ${res.recipientsCount} recipients`
      );
      setIsComposerOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleTriggerReminders = async () => {
    if (!weddingId) return;
    setIsTriggeringReminders(true);
    try {
      const res = await notificationService.triggerCeremonyReminders(weddingId);
      showToast(`✦ Ceremony countdown alerts checked: ${res.remindersTriggered} reminders triggered`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger reminders');
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  const handleRetry = async (id: string) => {
    if (!weddingId) return;
    try {
      await notificationService.retryNotification(weddingId, id);
      showToast('✦ Notification redispatched successfully');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Retry failed');
    }
  };

  const handleToggleTrigger = async (key: keyof TriggerSettings) => {
    if (!weddingId || !triggers) return;
    const updated = { ...triggers, [key]: !triggers[key] };
    setTriggers(updated);
    try {
      await notificationService.updateTriggerSettings(weddingId, { [key]: updated[key] });
      showToast(`✦ Trigger "${key}" updated`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update trigger');
      loadData();
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const q = searchQuery.toLowerCase();
      const name = item.recipientGuest?.displayName || item.recipientUser?.name || item.payload?.recipientName || '';
      const email = item.recipientGuest?.email || item.recipientUser?.email || item.payload?.recipientEmail || '';
      const subject = item.subject || '';
      const matchesSearch =
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeChannelFilter === 'WHATSAPP') return item.channel === 'WHATSAPP';
      if (activeChannelFilter === 'EMAIL') return item.channel === 'EMAIL';
      if (activeChannelFilter === 'FAILED') return item.status === 'FAILED';
      return true;
    });
  }, [notifications, searchQuery, activeChannelFilter]);

  return (
    <div className="relative w-full min-h-screen bg-[#FFFDF9] text-[#1E1B19] pb-24 font-sans selection:bg-[#F4BD6C] selection:text-[#291800]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 px-5 py-3.5 bg-[#1E1B19] text-[#FAF7F2] rounded-xl shadow-2xl border border-[#D4AF37]/40 flex items-center gap-3 animate-fade-in font-medium text-sm">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-8">
        {/* 1. HEADER & IMPERIAL CONTEXT BAR */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[#E9E1DD]">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <span>Imperial Dashboard</span>
              <span className="text-stone-300">/</span>
              <span>Wedding Workspace</span>
              <span className="text-stone-300">/</span>
              <span className="text-[#7F560C] font-bold">Dispatches & Alerts</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1B19] tracking-tight font-bold">
                Royal Notification & Dispatch Engine
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs sm:text-sm font-semibold text-[#B32446] tracking-wide">
                ॥ सन्देशं प्राप्य मोदन्ते — On Receiving Auspicious Tidings, All Hearts Rejoice ॥
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
              <span className="text-xs text-stone-500 font-medium">
                Multi-Channel WhatsApp & Resend Email Concierge • Automated Muhurtham Alerts
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleTriggerReminders}
              disabled={isTriggeringReminders}
              className="px-4 py-2.5 rounded-lg bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#780616] border border-[#780616]/20 transition-all text-xs font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>{isTriggeringReminders ? 'Checking Muhurats...' : 'Trigger Countdown Reminders'}</span>
            </button>
            <button
              onClick={() => setIsComposerOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-[#B32446] hover:bg-[#8F1633] text-white shadow-md transition-all text-xs font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-[#FFD9DC]" />
              <span>+ Inscribe Royal Broadcast</span>
            </button>
          </div>
        </section>

        {/* 2. TELEMETRY CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Dispatches */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Dispatches Delivered
                </span>
                <span className="font-serif text-3xl font-bold text-[#1E1B19] mt-1 leading-none">
                  {telemetry?.deliveredCount ?? 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#B32446]">
                <Send className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>{telemetry?.totalDispatches ?? 0} Transmissions logged</span>
              <span className="text-[#2E7D32] font-bold">100% Audit trail</span>
            </div>
          </div>

          {/* Card 2: Delivery Success Rate */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Delivery Success Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl font-bold text-[#1E1B19] leading-none">
                    {telemetry?.deliverySuccessRate ?? 100}%
                  </span>
                  <span className="text-[11px] text-[#2E7D32] font-bold">Resend & WhatsApp</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#2E7D32]">
                <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>High deliverability guarantee</span>
              <span className="text-[#7F560C] font-semibold">Zero spam drops</span>
            </div>
          </div>

          {/* Card 3: Active Queues */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  In-Flight & Queued
                </span>
                <span className="font-serif text-3xl font-bold text-[#1E1B19] mt-1 leading-none">
                  {telemetry?.pendingQueuedCount ?? 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FFF9E6] flex items-center justify-center text-[#B87A00]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Automated schedule runners</span>
              <span className="text-[#B87A00] font-bold">Active</span>
            </div>
          </div>

          {/* Card 4: Channel Distribution */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Channel Distribution
                </span>
                <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    WA: {telemetry?.channels.whatsapp ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Email: {telemetry?.channels.email ?? 0}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#7F560C]">
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Primary: WhatsApp Direct</span>
              <span>Resend Pro</span>
            </div>
          </div>
        </section>

        {/* 3. AUTOMATED TRIGGER POLICIES */}
        <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-[#B32446]" />
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E1B19]">
                  Automated Vivaha Notification Policies
                </h3>
                <p className="text-xs text-stone-500">
                  Toggle royal automation rules for instant zero-friction communication with guests and council stewards.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
              ● Active Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Trigger 1 */}
            <div
              onClick={() => handleToggleTrigger('autoInviteOnGuestAdd')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                triggers?.autoInviteOnGuestAdd
                  ? 'bg-[#FAF2EE] border-[#780616]/30'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div>
                <span className="font-bold text-[#1E1B19] block mb-1">
                  Instant Pass on Guest Add
                </span>
                <span className="text-stone-500 text-[11px] leading-relaxed">
                  Automatically mints digital pass and sends WhatsApp invitation when a guest is registered.
                </span>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  triggers?.autoInviteOnGuestAdd ? 'bg-[#780616] text-white' : 'bg-stone-200 text-stone-400'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Trigger 2 */}
            <div
              onClick={() => handleToggleTrigger('autoRsvpConfirmation')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                triggers?.autoRsvpConfirmation
                  ? 'bg-[#FAF2EE] border-[#780616]/30'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div>
                <span className="font-bold text-[#1E1B19] block mb-1">
                  RSVP Confirmation & Gate Pass
                </span>
                <span className="text-stone-500 text-[11px] leading-relaxed">
                  Dispatches an elegant confirmation email and WhatsApp gate pass slip upon successful RSVP response.
                </span>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  triggers?.autoRsvpConfirmation ? 'bg-[#780616] text-white' : 'bg-stone-200 text-stone-400'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Trigger 3 */}
            <div
              onClick={() => handleToggleTrigger('ceremonyCountdown24h')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                triggers?.ceremonyCountdown24h
                  ? 'bg-[#FAF2EE] border-[#780616]/30'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div>
                <span className="font-bold text-[#1E1B19] block mb-1">
                  24h Muhurtham Alert
                </span>
                <span className="text-stone-500 text-[11px] leading-relaxed">
                  Sends scheduled reminder with dress code, raga soundscape, and venue directions 24 hours prior.
                </span>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  triggers?.ceremonyCountdown24h ? 'bg-[#780616] text-white' : 'bg-stone-200 text-stone-400'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. DISPATCH LEDGER TABLE */}
        <section className="flex flex-col bg-white rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF2EE]/50 border-b border-[#E9E1DD]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search dispatches by recipient name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C] shadow-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveChannelFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeChannelFilter === 'ALL'
                    ? 'bg-[#1E1B19] text-[#FAF7F2]'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Channels ({notifications.length})
              </button>
              <button
                onClick={() => setActiveChannelFilter('WHATSAPP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeChannelFilter === 'WHATSAPP'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-emerald-700 hover:bg-stone-200'
                }`}
              >
                WhatsApp ({notifications.filter((n) => n.channel === 'WHATSAPP').length})
              </button>
              <button
                onClick={() => setActiveChannelFilter('EMAIL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeChannelFilter === 'EMAIL'
                    ? 'bg-[#780616] text-white'
                    : 'bg-stone-100 text-[#780616] hover:bg-stone-200'
                }`}
              >
                Email / Resend ({notifications.filter((n) => n.channel === 'EMAIL').length})
              </button>
              <button
                onClick={() => setActiveChannelFilter('FAILED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeChannelFilter === 'FAILED'
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-100 text-red-600 hover:bg-stone-200'
                }`}
              >
                Needs Attention ({notifications.filter((n) => n.status === 'FAILED').length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF2EE]/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-[#E9E1DD]">
                  <th className="py-3.5 px-6 font-semibold">Recipient Steward / Guest</th>
                  <th className="py-3.5 px-4 font-semibold">Channel</th>
                  <th className="py-3.5 px-4 font-semibold">Dispatch Subject & Scope</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Time Dispatched</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-[#1E1B19]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7F560C]" />
                      <span>Loading notification dispatch ledger...</span>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="font-semibold text-stone-600">No dispatches match the active filter</p>
                      <p className="text-xs mt-1">Click "+ Inscribe Royal Broadcast" to send a dispatch.</p>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((item) => {
                    const recipientName =
                      item.recipientGuest?.displayName ||
                      item.recipientUser?.name ||
                      item.payload?.recipientName ||
                      'Esteemed Guest';

                    const contact =
                      item.channel === 'WHATSAPP'
                        ? item.recipientGuest?.phone || item.payload?.recipientPhone || '—'
                        : item.recipientGuest?.email || item.recipientUser?.email || item.payload?.recipientEmail || '—';

                    const isSuccess = item.status === 'DELIVERED' || item.status === 'SENT';
                    const isFailed = item.status === 'FAILED';

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF2EE]/30 transition-colors">
                        {/* Recipient */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FAF2EE] text-[#780616] flex items-center justify-center font-bold text-xs shrink-0">
                              {recipientName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm text-[#1E1B19] leading-tight">
                                {recipientName}
                              </span>
                              <span className="text-[11px] text-stone-400 truncate">
                                {contact}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Channel Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {item.channel === 'WHATSAPP' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF2EE] text-[#780616] text-xs font-bold border border-[#780616]/20">
                              <Mail className="w-3.5 h-3.5 text-[#B32446]" />
                              Email Resend
                            </span>
                          )}
                        </td>

                        {/* Subject & Type */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-[#1E1B19] line-clamp-1">
                              {item.subject || 'Royal Vivaha Announcement'}
                            </span>
                            <span className="text-[11px] text-stone-400 line-clamp-1">
                              {item.payload?.message || item.type}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#2E7D32] font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                              Delivered
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                              <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                              Queued
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 whitespace-nowrap text-stone-500 text-xs">
                          {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {isFailed ? (
                            <button
                              onClick={() => handleRetry(item.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-1 ml-auto"
                            >
                              <RotateCw className="w-3 h-3" />
                              Retry
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-medium">Delivered</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 5. BROADCAST COMPOSER MODAL */}
      {isComposerOpen && (
        <>
          <div
            onClick={() => setIsComposerOpen(false)}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-[#FAF2EE] to-white border-b border-[#E9E1DD] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#780616] text-[#FAF7F2] flex items-center justify-center shadow-xs">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#1E1B19]">
                      Inscribe Royal Announcement
                    </h3>
                    <p className="text-xs text-stone-500">
                      Broadcast royal decrees, logistical memos, and ceremonial updates.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsComposerOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleBroadcastSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                {/* Target Segment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Select Recipient Segment</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'ALL_GUESTS', label: 'All Guests' },
                      { id: 'CONFIRMED_RSVP', label: 'Confirmed RSVPs' },
                      { id: 'PENDING_RSVP', label: 'Pending RSVPs' },
                      { id: 'COUNCIL_COLLABORATORS', label: 'Council Stewards' },
                    ].map((seg) => (
                      <button
                        type="button"
                        key={seg.id}
                        onClick={() => setBroadcastData({ ...broadcastData, segment: seg.id as any })}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                          broadcastData.segment === seg.id
                            ? 'bg-[#780616] text-white border-[#780616]'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Channel */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Dispatch Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BOTH', label: 'Multi-Channel (Both)' },
                      { id: 'WHATSAPP', label: 'WhatsApp Only' },
                      { id: 'EMAIL', label: 'Email Only' },
                    ].map((ch) => (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setBroadcastData({ ...broadcastData, channel: ch.id as any })}
                        className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                          broadcastData.channel === ch.id
                            ? 'bg-[#FAF2EE] text-[#780616] border-[#780616]'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Subject / Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={broadcastData.subject}
                    onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                    className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Imperial Message Body</label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                    className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C] resize-none"
                  />
                </div>

                {/* Live Card Preview */}
                <div className="p-4 rounded-xl bg-[#FAF2EE]/60 border border-[#D4AF37]/30 text-xs">
                  <span className="font-bold text-[#780616] uppercase text-[10px] tracking-wider block mb-1">
                    ✦ Dispatch Preview
                  </span>
                  <p className="font-serif font-bold text-[#1E1B19] text-sm">{broadcastData.subject}</p>
                  <p className="text-stone-600 mt-1 line-clamp-3">{broadcastData.message}</p>
                  <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Includes personalized guest token link</span>
                    <span className="text-[#B32446] font-semibold">Resend & WhatsApp Ready</span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBroadcast}
                    className="px-6 py-2.5 rounded-xl bg-[#B32446] hover:bg-[#8F1633] text-white shadow-md text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingBroadcast ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span>{isSubmittingBroadcast ? 'Broadcasting...' : 'Dispatch Imperial Broadcast ✦'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
