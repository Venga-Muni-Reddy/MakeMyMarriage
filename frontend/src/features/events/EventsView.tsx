import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Flame,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import { eventService, WeddingEvent } from '../../services/event.service';

export interface RitualCategory {
  id: string;
  label: string;
  icon: string;
  isDefault?: boolean;
}

export const DEFAULT_RITUAL_CATEGORIES: RitualCategory[] = [
  { id: 'HALDI', label: 'Sacred Haldi & Snanam', icon: '☀️', isDefault: true },
  { id: 'MEHENDI', label: 'Mehendi & Henna Lounge', icon: '🌿', isDefault: true },
  { id: 'SANGEET', label: 'Twilight Sangeet & Musical Gala', icon: '💃', isDefault: true },
  { id: 'VIVAHA', label: 'Vedic Vivaha & Saat Pheras', icon: '🔥', isDefault: true },
  { id: 'RECEPTION', label: 'Royal Reception & Doli Bidaai', icon: '🥂', isDefault: true },
  { id: 'COCKTAIL', label: 'Pre-Wedding Cocktail Night', icon: '🍸', isDefault: true },
  { id: 'ENGAGEMENT', label: 'Ring Exchange & Sagai', icon: '💍', isDefault: true },
  { id: 'PUJA', label: 'Ganesh Puja & Mandap Muhurat', icon: '🪔', isDefault: true },
  { id: 'OTHER', label: 'Custom Family Rite', icon: '✨', isDefault: true },
];

const EMOJI_PALETTE = ['☀️', '🌿', '💃', '🔥', '🥂', '🍸', '💍', '🪔', '🥥', '🌾', '🥁', '👑', '✨', '📿', '🌸', '💐', '🕊️'];

export const EventsView: React.FC = () => {
  const { currentWedding } = useWedding();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const weddingId = currentWedding?.id;

  // Custom Ritual Categories per wedding
  const [customCategories, setCustomCategories] = useState<RitualCategory[]>(() => {
    if (!weddingId) return [];
    try {
      const saved = localStorage.getItem(`mmm_custom_rituals_${weddingId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!weddingId) return;
    try {
      const saved = localStorage.getItem(`mmm_custom_rituals_${weddingId}`);
      if (saved) setCustomCategories(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [weddingId]);

  const saveCustomCategories = (updated: RitualCategory[]) => {
    setCustomCategories(updated);
    if (weddingId) {
      localStorage.setItem(`mmm_custom_rituals_${weddingId}`, JSON.stringify(updated));
    }
  };

  const allCategories = React.useMemo(() => {
    const list = [...DEFAULT_RITUAL_CATEGORIES, ...customCategories];
    events.forEach((ev) => {
      const rt = ev.settings?.ritualType;
      const label = ev.settings?.ritualCategoryLabel;
      const icon = ev.settings?.ritualCategoryIcon || '✨';
      if (rt && !list.some((c) => c.id === rt || c.label === rt)) {
        list.push({ id: rt, label: label || rt, icon });
      }
    });
    return list;
  }, [customCategories, events]);

  const getCategoryDisplay = (typeKey?: string) => {
    if (!typeKey) return { label: 'Sacred Rite', icon: '✨' };
    const found = allCategories.find((c) => c.id === typeKey || c.label === typeKey);
    if (found) return { label: found.label, icon: found.icon };
    return { label: typeKey, icon: '✨' };
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [locationName, setLocationName] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [ritualType, setRitualType] = useState('VIVAHA');
  const [isMuhurtham, setIsMuhurtham] = useState(true);
  const [muhurthamTime, setMuhurthamTime] = useState('11:24 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category Editor State inside Modal
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🪔');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const data = await eventService.getEvents(weddingId);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load ceremonies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [weddingId]);

  // Format Helper
  const formatTimeRange = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const s = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const e = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `${s} – ${e} IST`;
    } catch {
      return 'Timing Scheduled';
    }
  };

  const getEventDateKey = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '2026-11-28';
    }
  };

  // Group events by day
  const days = Array.from(new Set(events.map((e) => getEventDateKey(e.startAt)))).sort();

  const filteredEvents =
    selectedDay === 'all'
      ? events
      : events.filter((e) => getEventDateKey(e.startAt) === selectedDay);

  const weddingDateStr = currentWedding?.weddingDate || currentWedding?.settings?.startDate || new Date().toISOString();
  const defaultBaseDate = weddingDateStr.slice(0, 10);
  const defaultVenueName = currentWedding?.settings?.primaryVenueName || currentWedding?.settings?.primaryCity || 'Main Palace Hall';

  const openAddModal = (preset?: { name: string; ritualType: string; dressCode: string }) => {
    setEditingEvent(null);
    setFormError(null);
    setIsManagingCategories(false);
    setEditingCatId(null);
    setNewCatName('');
    setCoverImageUrl('');
    if (preset) {
      setName(preset.name);
      setRitualType(preset.ritualType);
      setDressCode(preset.dressCode);
      setIsMuhurtham(preset.ritualType === 'VIVAHA');
      setMuhurthamTime('11:24 AM');
    } else {
      setName('');
      setRitualType('VIVAHA');
      setDressCode('Vedic Imperial Silk & Crimson Turbans');
      setIsMuhurtham(true);
      setMuhurthamTime('11:24 AM');
    }
    setDescription('');
    setStartAt(`${defaultBaseDate}T10:00`);
    setEndAt(`${defaultBaseDate}T14:00`);
    setLocationName(defaultVenueName);
    setIsModalOpen(true);
  };

  const openEditModal = (event: WeddingEvent) => {
    setEditingEvent(event);
    setFormError(null);
    setIsManagingCategories(false);
    setEditingCatId(null);
    setNewCatName('');
    setName(event.name);
    setDescription(event.description || '');
    setCoverImageUrl(event.settings?.coverImageUrl || '');
    setStartAt(event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '');
    setEndAt(event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '');
    setLocationName(event.settings?.locationName || defaultVenueName);
    setDressCode(event.settings?.dressCode || 'Royal Formal');
    setRitualType(event.settings?.ritualType || 'VIVAHA');
    setIsMuhurtham(Boolean(event.settings?.isMuhurtham ?? (event.settings?.ritualType === 'VIVAHA')));
    setMuhurthamTime(event.settings?.muhurthamTime || '11:24 AM');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId) return;
    if (!name.trim()) {
      setFormError('Please enter a ceremony name.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const selectedCat = allCategories.find((c) => c.id === ritualType || c.label === ritualType);
    const categoryLabel = selectedCat ? selectedCat.label : ritualType;
    const categoryIcon = selectedCat ? selectedCat.icon : '✨';

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      locationName: locationName.trim(),
      dressCode: dressCode.trim(),
      settings: {
        ritualType,
        ritualCategoryLabel: categoryLabel,
        ritualCategoryIcon: categoryIcon,
        locationName: locationName.trim(),
        dressCode: dressCode.trim(),
        coverImageUrl: coverImageUrl.trim() || undefined,
        isMuhurtham,
        muhurthamTime: isMuhurtham ? muhurthamTime : undefined,
      },
    };

    try {
      if (editingEvent) {
        const updated = await eventService.updateEvent(weddingId, editingEvent.id, payload);
        setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await eventService.createEvent(weddingId, payload);
        setEvents((prev) => [...prev, created].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save ceremony details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!weddingId) return;
    if (!window.confirm('Are you sure you want to remove this ceremony from the itinerary?')) return;
    try {
      await eventService.deleteEvent(weddingId, eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const coupleNames = currentWedding?.settings?.partner1Name && currentWedding?.settings?.partner2Name
    ? `${currentWedding.settings.partner1Name} & ${currentWedding.settings.partner2Name}`
    : currentWedding?.name || 'Sacred Union';

  const weddingVenue = currentWedding?.settings?.primaryVenueName || currentWedding?.settings?.primaryCity || 'Auspicious Venue';

  return (
    <div className="space-y-8 font-sans text-on-surface antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CEREMONIAL CONTEXT STRIP */}
      {/* ========================================================================= */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-outline-variant/30">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-primary font-bold uppercase tracking-widest text-xs">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              Royal Concierge Folio
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 text-on-surface-variant text-xs">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                {coupleNames} • {weddingVenue} • Multi-Day Celebration
              </span>
            </div>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-on-surface font-bold tracking-tight leading-tight">
            Sacred Itinerary & Ceremonial Schedule
          </h1>
          <p className="text-sm text-on-surface-variant">
            Orchestrating Vedic Muhurthams, royal Rajputana galas, and bespoke guest experiences across multi-day celebrations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-end flex-wrap">
          <button
            onClick={handlePrint}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm border border-outline-variant/40 hover:bg-surface-container transition-all"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Export Print Folio</span>
          </button>

          <button
            onClick={() => openAddModal()}
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-white text-xs uppercase tracking-widest font-bold shadow-md hover:bg-secondary/90 transition-all shadow-secondary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Inaugurate New Ceremony</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MULTI-DAY ITINERARY DAY SELECTOR (HORIZONTAL TAB RAIL) */}
      {/* ========================================================================= */}
      <section className="w-full">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedDay === 'all'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
            }`}
          >
            All Celebratory Days ({events.length} Events)
          </button>

          {days.map((dayStr, index) => {
            const count = events.filter((e) => getEventDateKey(e.startAt) === dayStr).length;
            const dateObj = new Date(dayStr);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDay(dayStr)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border flex items-center gap-2 ${
                  selectedDay === dayStr
                    ? 'bg-gradient-to-r from-primary to-primary-container text-white border-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                <span>
                  Day 0{index + 1} • {formattedDate}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedDay === dayStr ? 'bg-white/20 text-white' : 'bg-surface-container text-primary font-bold'
                  }`}
                >
                  {count} Events
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN CEREMONIAL WORKSPACE */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Main Ceremony Timeline Rail (8 Cols = ~68%) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
              Loading sacred itinerary...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/40">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-serif text-lg font-bold text-on-surface">No Ceremonies Scheduled for this Day</h3>
              <p className="text-xs text-on-surface-variant mt-1">Inaugurate a ritual ceremony or inject the standard royal template.</p>
              <button
                onClick={() => openAddModal()}
                className="mt-4 px-5 py-2 rounded-xl bg-primary text-on-primary text-xs uppercase tracking-wider font-bold"
              >
                + Add Ceremony
              </button>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-10 flex flex-col gap-8">
              {/* Continuous Champagne Gold Hairline Track */}
              <div className="absolute left-2.5 sm:left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-primary-container to-outline-variant/30" />

              {filteredEvents.map((event) => {
                const isHero = event.settings?.isMuhurtham || event.settings?.ritualType === 'VIVAHA';
                const milestones = event.settings?.milestones || [];
                const dressColors = event.settings?.dressCodeColors || ['#9F1239', '#D4AF37', '#FFFDF9'];

                return (
                  <div key={event.id} className="relative flex flex-col">
                    {/* Diamond Node Marker */}
                    <div
                      className={`absolute -left-[27px] sm:-left-[39px] top-6 w-6 h-6 rotate-45 border-2 shadow-sm flex items-center justify-center ${
                        isHero
                          ? 'bg-primary border-surface-container-lowest'
                          : 'bg-surface-container-lowest border-primary'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 -rotate-45 block rounded-full ${
                          isHero ? 'bg-on-primary' : 'bg-primary'
                        }`}
                      />
                    </div>

                    {/* Ceremony Card Container */}
                    <div
                      className={`relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col gap-4 border ${
                        isHero ? 'border-primary/40 ring-1 ring-primary/20 shadow-primary/10' : 'border-outline-variant/40'
                      }`}
                    >
                      {/* Card Header & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(() => {
                            const catDisplay = getCategoryDisplay(event.settings?.ritualType);
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/50 text-primary font-bold text-xs uppercase tracking-wider">
                                <span>{catDisplay.icon}</span>
                                <span>{catDisplay.label}</span>
                              </span>
                            );
                          })()}

                          {event.settings?.isMuhurtham && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold animate-pulse">
                              <Flame className="w-3.5 h-3.5 fill-secondary" />
                              Shubh Muhurtham {event.settings.muhurthamTime || '11:24 AM'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{formatTimeRange(event.startAt, event.endAt)}</span>
                        </div>
                      </div>

                      {/* Event Title & Location */}
                      <div className="flex flex-col gap-1">
                        <h2 className="font-serif text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
                          {event.name}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-on-surface">
                            {event.settings?.locationName || 'The Leela Palace, Udaipur'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {/* Cover Image Banner (Only rendered if user uploaded/configured an image) */}
                      {event.settings?.coverImageUrl && (
                        <div className="w-full h-40 sm:h-48 rounded-xl overflow-hidden relative shadow-inner">
                          <img
                            src={event.settings.coverImageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                            <div className="flex items-center justify-between w-full text-white text-xs">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                {(() => {
                                  const cd = getCategoryDisplay(event.settings?.ritualType);
                                  return `${cd.icon} ${cd.label}`;
                                })()}
                              </span>
                              {event.settings?.locationName && (
                                <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px]">
                                  {event.settings.locationName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ritual Milestones Breakdown */}
                      {milestones.length > 0 && (
                        <div className="flex flex-col gap-2 pt-1">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            Vedic Ceremony Sequence • {milestones.length} Milestones
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {milestones.map((m: any, mIdx: number) => (
                              <div
                                key={mIdx}
                                className="p-2.5 rounded-xl bg-surface-container-low/70 flex items-start gap-2.5 border border-outline-variant/30"
                              >
                                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-bold text-primary shrink-0">
                                  {m.time}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-on-surface leading-tight">
                                    {m.title}
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                                    {m.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attire & Clearance Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/30 text-xs">
                        {/* Dress Code */}
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-semibold">Dress Code:</span>
                          <span className="font-bold text-on-surface">
                            {event.settings?.dressCode || 'Royal Traditional Silk'}
                          </span>
                          <div className="flex items-center gap-1 pl-1">
                            {dressColors.map((color: string, cIdx: number) => (
                              <span
                                key={cIdx}
                                className="w-3 h-3 rounded-full inline-block shadow-xs border border-white"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Guest Tier Pill */}
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{event.settings?.guestTier || 'All Confirmed Guests Invited'}</span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(event)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-primary" />
                            <span>Edit Ceremony Details</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-on-surface-variant hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete Ceremony"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Telemetry, Vedic Pandit & Presets Sidebar (4 Cols = ~32%) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Schedule Telemetry */}
          <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/40 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-primary">
                Ceremony Telemetry
              </span>
              <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-ping" />
                Active Synchronized
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                <span className="font-serif text-3xl font-bold text-primary leading-none">
                  {events.length}
                </span>
                <span className="text-xs font-bold text-on-surface mt-1">Ceremonies</span>
                <span className="text-[10px] text-on-surface-variant">Scheduled</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                <span className="font-serif text-3xl font-bold text-secondary leading-none">
                  {days.length}
                </span>
                <span className="text-xs font-bold text-on-surface mt-1">Festive Days</span>
                <span className="text-[10px] text-on-surface-variant">Multi-Day Timeline</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                <span className="font-serif text-3xl font-bold text-on-surface leading-none">
                  {new Set(events.map(e => e.settings?.locationName || e.venue?.name).filter(Boolean)).size || (currentWedding?.settings?.primaryVenueName ? 1 : 0)}
                </span>
                <span className="text-xs font-bold text-on-surface mt-1">Venues</span>
                <span className="text-[10px] text-on-surface-variant">Mapped Locations</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                <span className="font-serif text-3xl font-bold text-amber-600 leading-none">
                  {events.filter(e => e.settings?.isMuhurtham || e.settings?.ritualType === 'VIVAHA').length}
                </span>
                <span className="text-xs font-bold text-on-surface mt-1">Muhurthams</span>
                <span className="text-[10px] text-on-surface-variant">Auspicious Rites</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ceremonial Protocol & Vedic Guidelines */}
          <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-primary">
                Ceremonial Protocol &amp; Guidelines
              </span>
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary text-[10px] font-bold">
                Vedic Best Practices
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">●</span>
                <span className="text-on-surface-variant">
                  <strong className="text-on-surface">Shubh Muhurtham:</strong> Mark key sacred rituals as Muhurtham to automatically highlight them on digital invitations and the live stream feed.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-secondary font-bold shrink-0">●</span>
                <span className="text-on-surface-variant">
                  <strong className="text-on-surface">Dress Code Palette:</strong> Inform your guests of appropriate traditional attire (e.g. Haldi Amber, Midnight Velvet) for each specific event.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">●</span>
                <span className="text-on-surface-variant">
                  <strong className="text-on-surface">Venue Coordination:</strong> Assign specific halls or lawns to guide guests smoothly upon QR check-in arrival.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Ceremony Presets Quick-Add */}
          <div className="rounded-2xl bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider font-bold text-primary">
              Ritual Template Quick-Add
            </span>
            <p className="text-xs text-on-surface-variant">
              Inject royal Rajputana ceremonial presets with standard Muhurtham times and dress codes:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() =>
                  openAddModal({
                    name: 'Sacred Haldi & Mangal Snanam',
                    ritualType: 'HALDI',
                    dressCode: 'Haldi Amber & Sunshine Yellows',
                  })
                }
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-left text-xs font-semibold transition-all flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>☀️ Haldi Rites</span>
              </button>

              <button
                onClick={() =>
                  openAddModal({
                    name: 'Mehendi & Henna Alcove',
                    ritualType: 'MEHENDI',
                    dressCode: 'Emerald Green & Mint Florals',
                  })
                }
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-left text-xs font-semibold transition-all flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span>🌿 Mehendi</span>
              </button>

              <button
                onClick={() =>
                  openAddModal({
                    name: 'Twilight Sangeet & Musical Gala',
                    ritualType: 'SANGEET',
                    dressCode: 'Midnight Velvet & Shimmering Lehengas',
                  })
                }
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-left text-xs font-semibold transition-all flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 shrink-0" />
                <span>💃 Sangeet Gala</span>
              </button>

              <button
                onClick={() =>
                  openAddModal({
                    name: 'Vedic Vivaha & Saat Pheras',
                    ritualType: 'VIVAHA',
                    dressCode: 'Vedic Imperial Silk & Crimson Turbans',
                  })
                }
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-left text-xs font-semibold transition-all flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                <span>🔥 Vedic Vivaha</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INAUGURATE / EDIT CEREMONY MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4 fill-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-on-surface">
                  {editingEvent ? 'Edit Ceremony Details' : 'Inaugurate New Sacred Ceremony'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Configure ceremonial timings, venue halls, and dress codes
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Ceremony Inscription / Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vedic Vivaha & Lagna Muhurtham"
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                    Ritual Category
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManagingCategories(!isManagingCategories);
                      setEditingCatId(null);
                      setNewCatName('');
                    }}
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isManagingCategories ? 'Hide Category Editor' : '+ Add / Edit Custom Category'}
                  </button>
                </div>

                <select
                  value={ritualType}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      setIsManagingCategories(true);
                      setEditingCatId(null);
                      setNewCatName('');
                    } else {
                      setRitualType(e.target.value);
                      if (e.target.value === 'VIVAHA') {
                        setIsMuhurtham(true);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                >
                  <optgroup label="Standard Traditions">
                    {DEFAULT_RITUAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="Your Custom Ritual Categories">
                      {customCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__ADD_NEW__">➕ + Add New Custom Ritual Category...</option>
                </select>

                {/* Inline Custom Category Creator / Editor */}
                {isManagingCategories && (
                  <div className="mt-3 p-3.5 rounded-xl bg-surface-container border border-primary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 fill-primary" />
                        {editingCatId ? 'Edit Custom Ritual Category' : 'Create Custom Ritual Category'}
                      </span>
                      {editingCatId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(null);
                            setNewCatName('');
                          }}
                          className="text-[11px] text-on-surface-variant hover:underline"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-on-surface-variant">Choose Icon:</span>
                        <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/40 flex-wrap">
                          {EMOJI_PALETTE.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewCatIcon(emoji)}
                              className={`w-7 h-7 rounded text-sm flex items-center justify-center transition-all ${
                                newCatIcon === emoji ? 'bg-primary-fixed text-primary scale-110 font-bold shadow-xs' : 'hover:bg-surface-container'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Pellikuthuru & Talambralu, Anand Karaj, Kashi Yatra..."
                          className="flex-1 px-3 py-2 bg-surface-container-lowest text-on-surface text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCatName.trim()) return;
                            if (editingCatId) {
                              const updated = customCategories.map((c) =>
                                c.id === editingCatId ? { ...c, label: newCatName.trim(), icon: newCatIcon } : c
                              );
                              saveCustomCategories(updated);
                              setEditingCatId(null);
                            } else {
                              const newId = `CUSTOM_${Date.now()}`;
                              const newCat: RitualCategory = {
                                id: newId,
                                label: newCatName.trim(),
                                icon: newCatIcon,
                              };
                              const updated = [...customCategories, newCat];
                              saveCustomCategories(updated);
                              setRitualType(newId);
                            }
                            setNewCatName('');
                          }}
                          disabled={!newCatName.trim()}
                          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {editingCatId ? 'Update' : '+ Save Category'}
                        </button>
                      </div>
                    </div>

                    {/* Manage Existing Custom Categories */}
                    {customCategories.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/30 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant mr-1">
                          Custom List ({customCategories.length}):
                        </span>
                        {customCategories.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/30 text-xs"
                          >
                            <span>{cat.icon}</span>
                            <span className="font-medium text-on-surface">{cat.label}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setNewCatName(cat.label);
                                setNewCatIcon(cat.icon);
                              }}
                              className="text-on-surface-variant hover:text-primary p-0.5"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = customCategories.filter((c) => c.id !== cat.id);
                                saveCustomCategories(updated);
                                if (ritualType === cat.id) {
                                  setRitualType('VIVAHA');
                                }
                              }}
                              className="text-on-surface-variant hover:text-rose-600 p-0.5"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shubh Muhurtham Designation Toggle */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-secondary fill-secondary" />
                    Sacred Shubh Muhurtham Ceremony
                  </span>
                  <p className="text-[11px] text-on-surface-variant">
                    Highlights this ceremony with auspicious badges on digital invites &amp; livestream feed
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMuhurtham}
                    onChange={(e) => setIsMuhurtham(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>

              {isMuhurtham && (
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                    Auspicious Muhurtham Exact Time
                  </label>
                  <input
                    type="text"
                    value={muhurthamTime}
                    onChange={(e) => setMuhurthamTime(e.target.value)}
                    placeholder="e.g. 11:24 AM or 09:15 AM - 10:45 AM"
                    className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Palace Venue / Hall Location
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Palace Lakeside Mandap, The Leela Palace"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Dress Code & Aesthetic Recommendation
                </label>
                <input
                  type="text"
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="e.g. Vedic Imperial Silk & Crimson Turbans"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Ceremony Backdrop / Cover Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/... or leave blank"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                />
                {coverImageUrl && (
                  <div className="mt-2 w-full h-28 rounded-xl overflow-hidden border border-outline-variant/40 relative shadow-sm">
                    <img
                      src={coverImageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Ceremonial Description / Ritual Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide ceremonial highlights, musical artists, or arrival guidelines for guests..."
                  className="w-full px-3.5 py-2 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-secondary text-white text-xs uppercase tracking-wider font-bold shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Ceremony...' : editingEvent ? 'Update Ceremony' : 'Inaugurate Ceremony'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
