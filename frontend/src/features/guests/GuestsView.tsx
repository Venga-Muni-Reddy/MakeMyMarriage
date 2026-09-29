import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Hourglass,
  QrCode,
  Edit2,
  Trash2,
  X,
  MessageCircle,
  Building,
  Utensils,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Flame,
  Check,
  Share2,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import {
  guestService,
  RoyalGuest,
  GuestTelemetry,
  GuestCategory,
  CompanionPax,
} from '../../services/guest.service';
import { eventService, WeddingEvent } from '../../services/event.service';

export const GuestsView: React.FC = () => {
  const { currentWedding } = useWedding();
  const [guests, setGuests] = useState<RoyalGuest[]>([]);
  const [telemetry, setTelemetry] = useState<GuestTelemetry | null>(null);
  const [categories, setCategories] = useState<GuestCategory[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSide, setSelectedSide] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRsvp, setSelectedRsvp] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Multi-selection for bulk actions
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Slide-over Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<RoyalGuest | null>(null);

  // Companion / Pass Modal State
  const [inspectingGuest, setInspectingGuest] = useState<RoyalGuest | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Form State
  const [honorific, setHonorific] = useState('Shri');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [side, setSide] = useState<'BRIDE' | 'GROOM' | 'BOTH' | 'NEUTRAL'>('GROOM');
  const [categoryId, setCategoryId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [allocatedSuite, setAllocatedSuite] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [householdRole, setHouseholdRole] = useState('HEAD');
  const [dietary, setDietary] = useState<string>('PURE_VEG');
  const [allergies, setAllergies] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'ATTENDING' | 'AWAITING' | 'DECLINED'>('AWAITING');
  const [companions, setCompanions] = useState<CompanionPax[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ceremonyFilter, setCeremonyFilter] = useState<'ALL' | 'MANDAP_ASSIGNED' | 'MANDAP_UNASSIGNED'>('ALL');

  const weddingId = currentWedding?.id;

  // Load guests & events
  const loadData = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const [guestRes, eventList] = await Promise.all([
        guestService.getGuests(weddingId, {
          search: searchQuery,
          side: selectedSide,
          categoryId: selectedCategory,
          rsvpStatus: selectedRsvp,
          isArchived: showArchived ? true : undefined,
        }),
        eventService.getEvents(weddingId),
      ]);

      setGuests(guestRes.items);
      setTelemetry(guestRes.telemetry);
      setCategories(guestRes.categories);
      setEvents(eventList);
    } catch (err) {
      console.error('Failed to load guest chancery roll', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedGuestIds([]);
    loadData();
  }, [weddingId, selectedSide, selectedCategory, selectedRsvp, showArchived]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Open Drawer for Add
  const handleOpenAddDrawer = () => {
    setEditingGuest(null);
    setHonorific('Shri');
    setFirstName('');
    setLastName('');
    setSide('GROOM');
    setCategoryId(categories[0]?.id || '');
    setPhone('');
    setEmail('');
    setCity('');
    setAllocatedSuite('');
    setHouseholdName('');
    setHouseholdRole('HEAD');
    setDietary('PURE_VEG');
    setAllergies('');
    setRsvpStatus('AWAITING');
    setCompanions([]);
    setSelectedEventIds(events.map((e) => e.id));
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEditDrawer = (guest: RoyalGuest) => {
    setEditingGuest(guest);
    const m = guest.metadata || {};
    setHonorific(m.honorific || 'Shri');
    setFirstName(guest.firstName || '');
    setLastName(guest.lastName || '');
    setSide(guest.side || 'GROOM');
    setCategoryId(guest.categoryId || categories[0]?.id || '');
    setPhone(guest.phone || '');
    setEmail(guest.email || '');
    setCity(m.city || '');
    setAllocatedSuite(m.allocatedSuite || '');
    setHouseholdName(m.householdName || '');
    setHouseholdRole(m.householdRole || 'HEAD');
    setDietary(m.dietary || 'PURE_VEG');
    setAllergies(m.allergies || '');
    setRsvpStatus(m.rsvpStatus || 'AWAITING');
    setCompanions(m.companions ? [...m.companions] : []);
    setSelectedEventIds(guest.guestEvents?.map((ge) => ge.eventId) || events.map((e) => e.id));
    setIsDrawerOpen(true);
  };

  // Add Companion row in Drawer
  const handleAddCompanion = () => {
    setCompanions([...companions, { name: '', relation: 'Spouse', dietary: 'PURE_VEG' }]);
  };

  const handleUpdateCompanion = (index: number, field: keyof CompanionPax, value: string) => {
    const updated = [...companions];
    updated[index] = { ...updated[index], [field]: value };
    setCompanions(updated);
  };

  const handleRemoveCompanion = (index: number) => {
    setCompanions(companions.filter((_, i) => i !== index));
  };

  // Toggle Event Checkbox
  const handleToggleEvent = (evId: string) => {
    if (selectedEventIds.includes(evId)) {
      setSelectedEventIds(selectedEventIds.filter((id) => id !== evId));
    } else {
      setSelectedEventIds([...selectedEventIds, evId]);
    }
  };

  // Submit Drawer Form
  const handleSubmitDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId || !firstName.trim()) return;

    setIsSubmitting(true);
    try {
      const paxCount = 1 + companions.length;
      let dietaryLabel = 'Pure Vegetarian';
      if (dietary === 'JAIN') dietaryLabel = '🌿 Jain Saatvik (No Root)';
      else if (dietary === 'NON_VEG') dietaryLabel = '🍗 Multi-Cuisine / Non-Veg';
      else if (dietary === 'GLUTEN_FREE') dietaryLabel = '🌾 Gluten-Free / Vegan';

      const payload = {
        honorific,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        side,
        categoryId: categoryId || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        allocatedSuite: allocatedSuite.trim() || undefined,
        householdName: householdName.trim() || `${lastName || firstName} Household`,
        householdRole,
        paxCount,
        companions: companions.filter((c) => c.name.trim()),
        dietary,
        dietaryLabel,
        allergies: allergies.trim() || undefined,
        rsvpStatus,
        eventIds: selectedEventIds,
      };

      if (editingGuest) {
        await guestService.updateGuest(weddingId, editingGuest.id, payload);
      } else {
        await guestService.createGuest(weddingId, payload);
      }

      setIsDrawerOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to enroll royal guest', err);
      alert('Error updating guest record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Archive Guest
  const handleDeleteGuest = async (guestId: string, name: string) => {
    if (!weddingId) return;
    if (!confirm(`Are you certain you wish to archive "${name}" from the active chancery roll?`)) return;

    try {
      await guestService.deleteGuest(weddingId, guestId);
      loadData();
    } catch (err) {
      console.error('Failed to archive guest', err);
    }
  };

  // Unarchive / Restore Guest
  const handleUnarchiveGuest = async (guestId: string, _name?: string) => {
    if (!weddingId) return;
    try {
      await guestService.unarchiveGuest(weddingId, guestId);
      loadData();
    } catch (err) {
      console.error('Failed to unarchive guest', err);
      alert('Failed to restore guest to active roll');
    }
  };

  // Ceremony & Mandap Access Computations
  const vivahaEvent = events.find(
    (e) =>
      e.name.toLowerCase().includes('vivaha') ||
      e.name.toLowerCase().includes('mandap') ||
      e.name.toLowerCase().includes('pher') ||
      (e.settings as any)?.ritualType === 'VIVAHA'
  );

  const mandapAssignedHouseholds = guests.filter((g) =>
    vivahaEvent ? g.guestEvents?.some((ge) => ge.eventId === vivahaEvent.id) : false
  ).length;

  const mandapUnassignedHouseholds = Math.max(0, guests.length - mandapAssignedHouseholds);

  const displayedGuests = guests.filter((guest) => {
    if (ceremonyFilter === 'MANDAP_ASSIGNED') {
      return vivahaEvent ? guest.guestEvents?.some((ge) => ge.eventId === vivahaEvent.id) : true;
    }
    if (ceremonyFilter === 'MANDAP_UNASSIGNED') {
      return vivahaEvent ? !guest.guestEvents?.some((ge) => ge.eventId === vivahaEvent.id) : true;
    }
    return true;
  });

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedGuestIds(displayedGuests.map((g) => g.id));
    } else {
      setSelectedGuestIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedGuestIds.includes(id)) {
      setSelectedGuestIds(selectedGuestIds.filter((item) => item !== id));
    } else {
      setSelectedGuestIds([...selectedGuestIds, id]);
    }
  };

  const handleBulkAction = async (action: 'ASSIGN_CEREMONY' | 'UPDATE_DIETARY' | 'ARCHIVE' | 'UNARCHIVE' | 'DISPATCH_WHATSAPP') => {
    if (!weddingId || selectedGuestIds.length === 0) return;

    let eventId: string | undefined;
    let dietaryChoice: string | undefined;

    if (action === 'ASSIGN_CEREMONY') {
      const vivahaEvent = events.find((e) =>
        e.name.toLowerCase().includes('vivaha') ||
        e.name.toLowerCase().includes('mandap') ||
        e.name.toLowerCase().includes('pher') ||
        (e.settings as any)?.ritualType === 'VIVAHA'
      );

      if (vivahaEvent) {
        const confirmAssign = confirm(
          `Grant Mandap Seating access to ${selectedGuestIds.length} royal household(s) for:\n\n"${vivahaEvent.name}"?`
        );
        if (!confirmAssign) return;
        eventId = vivahaEvent.id;
      } else {
        const selected = prompt(
          `Choose ceremony to assign:\n${events.map((e, i) => `${i + 1}. ${e.name}`).join('\n')}\nEnter number:`
        );
        if (!selected) return;
        const index = parseInt(selected, 10) - 1;
        if (!events[index]) {
          alert('Invalid ceremony selection');
          return;
        }
        eventId = events[index].id;
      }
    } else if (action === 'UPDATE_DIETARY') {
      const choice = prompt('Enter dietary code: JAIN, PURE_VEG, or NON_VEG');
      if (!choice) return;
      dietaryChoice = choice.toUpperCase();
    } else if (action === 'ARCHIVE') {
      if (!confirm(`Archive ${selectedGuestIds.length} royal households to the vault?`)) return;
    } else if (action === 'UNARCHIVE') {
      if (!confirm(`Restore ${selectedGuestIds.length} royal household(s) back to the active roll?`)) return;
    }

    setIsBulkProcessing(true);
    try {
      await guestService.bulkAction(weddingId, {
        guestIds: selectedGuestIds,
        action,
        eventId,
        dietary: dietaryChoice,
      });
      setSelectedGuestIds([]);
      loadData();
    } catch (err) {
      console.error('Bulk action failed', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    if (!weddingId) return;
    try {
      await guestService.downloadExportCsv(weddingId);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to generate CSV manifesto');
    }
  };

  // Quick WhatsApp Link
  const openWhatsApp = (phoneStr?: string | null, name?: string) => {
    if (!phoneStr) {
      alert('No mobile contact registered for this household');
      return;
    }
    const cleanPhone = phoneStr.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Khammaghani! Honored ${name || 'Guest'}, greetings from the royal chancery of the Ranawat & Rathore Vivaha. Your imperial wedding pass and itinerary are available in your portal.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Calculations for display
  const totalPaxSelected = useMemo(() => {
    return guests
      .filter((g) => selectedGuestIds.includes(g.id))
      .reduce((acc, g) => acc + (Number(g.metadata?.paxCount) || 1), 0);
  }, [guests, selectedGuestIds]);

  return (
    <div className="w-full min-h-screen bg-surface font-body-md text-on-surface antialiased pb-24">
      {/* 1. Sub-Header / Breadcrumb & Imperial Action Strip */}
      <section className="w-full bg-surface-container-low/80 backdrop-blur-md px-4 sm:px-8 py-5 border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left Title Context */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-widest uppercase">
              <Flame className="w-4 h-4 text-primary fill-primary animate-pulse" />
              <span>
                {currentWedding?.name || 'Ranawat & Rathore Royal Vivaha'} • Udaipur, Rajasthan
              </span>
              <span className="h-1 w-1 rounded-full bg-primary/40" />
              <span className="text-on-surface-variant font-normal">Zenana &amp; Mardana Chancery</span>
            </div>
            <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold tracking-tight">
              Royal Guest Registry &amp; Households
            </h1>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-3xl">
              Curate the sovereign guest roll, orchestrate multi-generational households, supervise dietary
              santulan, and allocate court access across the palace enclaves.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 xl:pt-0">
            <button
              onClick={() => alert('Import Folio: CSV upload parser ready for production rollout')}
              className="flex items-center gap-2 bg-surface-container-lowest hover:bg-surface-container px-4 py-2.5 rounded-lg border border-outline-variant/40 shadow-xs hover:shadow transition-all text-xs font-semibold uppercase tracking-wider text-on-surface"
            >
              <Upload className="w-4 h-4 text-primary" />
              <span>Import Folio</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 bg-surface-container-lowest hover:bg-surface-container px-4 py-2.5 rounded-lg border border-outline-variant/40 shadow-xs hover:shadow transition-all text-xs font-semibold uppercase tracking-wider text-on-surface"
            >
              <Download className="w-4 h-4 text-secondary" />
              <span>Export Manifesto</span>
            </button>

            <button
              onClick={handleOpenAddDrawer}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 text-xs font-semibold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Royal Guest</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Canvas Container */}
      <div className="w-full px-4 sm:px-8 py-6 max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* 2. Regal Telemetry KPI Bar */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Capacity & Households */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Invited Nobles
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-lg text-3xl font-bold text-on-surface">
                    {telemetry?.totalGuests || 0}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Guests</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                <span>{telemetry?.totalHouseholds || 0} Royal Households</span>
                <span className="font-semibold text-primary">{telemetry?.capacityPercentage || 0}% Capacity</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-700"
                  style={{ width: `${telemetry?.capacityPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: RSVP Confirmations */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  RSVP Confirmations
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-lg text-3xl font-bold text-on-surface">
                    {telemetry?.confirmedAttending || 0}
                  </span>
                  <span className="text-[11px] text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-semibold">
                    {telemetry?.attendingPercentage || 0}% Attending
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container text-secondary">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-error" />
                <span>{telemetry?.regretfullyDeclined || 0} Declined</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-primary-container" />
                <span>{telemetry?.awaitingResponse || 0} Sealed / Awaiting</span>
              </div>
            </div>
          </div>

          {/* Card 3: Dietary Santulan */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Dietary Santulan
                </span>
                <div className="font-headline-sm text-xl font-bold text-on-surface mt-1">
                  {telemetry?.totalGuests || 0} Cataloged
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container text-tertiary">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {telemetry?.dietarySplit?.pureVeg || 0} Pure Veg
              </span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-container" /> {telemetry?.dietarySplit?.jainSaatvik || 0} Jain
              </span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {telemetry?.dietarySplit?.nonVeg || 0} Non-Veg
              </span>
              <span className="bg-error-container/40 text-on-error-container px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-error" /> {telemetry?.dietarySplit?.allergies || 0} Allergies
              </span>
            </div>
          </div>

          {/* Card 4: Mandap Access */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span>Mandap Seating Access</span>
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline-lg text-3xl font-bold text-primary">
                    {telemetry?.mandapHouseholdsCount !== undefined ? telemetry.mandapHouseholdsCount : mandapAssignedHouseholds}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    / {guests.length} Households ({telemetry?.mandapAccessCount || 0} Pax)
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-primary-fixed/20 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <div className="flex items-center gap-1.5 text-secondary font-semibold">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                <span>{telemetry?.mandapHouseholdsCount !== undefined ? telemetry.mandapHouseholdsCount : mandapAssignedHouseholds} Assigned</span>
              </div>
              <span className="text-outline-variant font-light">|</span>
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="h-2 w-2 rounded-full bg-outline-variant" />
                <span>{telemetry?.mandapUnassignedHouseholdsCount !== undefined ? telemetry.mandapUnassignedHouseholdsCount : mandapUnassignedHouseholds} Not Assigned</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Palace Imagery Ambient Banner */}
        <section className="w-full relative rounded-xl overflow-hidden bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low border border-outline-variant/30 p-6 flex items-center shadow-xs">
          <div className="relative z-10 max-w-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <Building className="w-4 h-4" />
              <span>Zenana &amp; Mardana Protocol Office</span>
            </div>
            <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
              Imperial Hospitality &amp; Guest Accommodation Active
            </h2>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Royal suites allocated across Taj Lake Palace, Shiv Niwas Palace, and Fateh Prakash. Chauffeur pickup and QR pass validation synchronized with Udaipur International Airport pavilion.
            </p>
          </div>
        </section>

        {/* 4. Command Toolbar & Precision Filters */}
        <section className="flex flex-col gap-4">
          {/* Roll Status Tabs: Active vs Archived Vault */}
          <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                !showArchived
                  ? 'bg-primary-container text-on-primary-container border-primary-container shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active Chancery Roll</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  !showArchived
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container text-primary font-bold'
                }`}
              >
                {telemetry?.totalHouseholds || 0} Households
              </span>
            </button>

            <button
              onClick={() => setShowArchived(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                showArchived
                  ? 'bg-secondary text-white border-secondary shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>📦 Archived Vault</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  showArchived
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container text-secondary font-bold'
                }`}
              >
                {telemetry?.archivedHouseholds || 0}
              </span>
            </button>
          </div>

          {/* Archived notice banner */}
          {showArchived && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-secondary-fixed/20 border border-secondary/30 px-4 py-2.5 rounded-lg text-on-secondary-fixed text-xs gap-2">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-secondary shrink-0" />
                <span>
                  Viewing <strong>Archived Chancery Vault</strong>. Households here are preserved but omitted from active ceremony allocations.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-secondary">
                Click "Unarchive" on any row to restore to the active roll
              </span>
            </div>
          )}

          {/* Top Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by noble name, household, phone (+91), email, or city (e.g. Udaipur, Jodhpur)..."
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 pl-11 pr-4 py-2.5 rounded-lg border border-outline-variant/40 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Actions / Reset */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                onClick={() => {
                  setSelectedSide('ALL');
                  setSelectedCategory('ALL');
                  setSelectedRsvp('ALL');
                  setCeremonyFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-2.5 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface rounded-lg border border-outline-variant/40 shadow-xs text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Affiliation Pill Rail */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-on-surface-variant text-[11px] mr-1">
              Affiliation:
            </span>
            {[
              { id: 'ALL', label: 'All Sides' },
              { id: 'BRIDE', label: "Bride's Court (Rathore)" },
              { id: 'GROOM', label: "Groom's Baraat (Ranawat)" },
              { id: 'BOTH', label: 'Mutual & Honored' },
            ].map((sideOpt) => (
              <button
                key={sideOpt.id}
                onClick={() => setSelectedSide(sideOpt.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all border ${
                  selectedSide === sideOpt.id
                    ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                {sideOpt.label}
              </button>
            ))}

            <span className="text-outline-variant font-light mx-2 hidden md:inline">|</span>

            <span className="font-semibold uppercase tracking-wider text-on-surface-variant text-[11px] mr-1">
              Circle:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all border ${
                selectedCategory === 'ALL'
                  ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              All Circles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Mandap Seating Filter Rail */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-outline-variant/20">
            <span className="font-semibold uppercase tracking-wider text-on-surface-variant text-[11px] mr-1 flex items-center gap-1">
              🪷 Mandap Seating:
            </span>
            <button
              onClick={() => setCeremonyFilter('ALL')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all border ${
                ceremonyFilter === 'ALL'
                  ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              All Households ({guests.length})
            </button>
            <button
              onClick={() => setCeremonyFilter('MANDAP_ASSIGNED')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all border flex items-center gap-1.5 ${
                ceremonyFilter === 'MANDAP_ASSIGNED'
                  ? 'bg-secondary text-white border-secondary font-semibold shadow-xs'
                  : 'bg-surface-container-lowest text-secondary border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              <span>✓ Mandap Assigned</span>
              <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed/40 text-[10px] font-bold">
                {mandapAssignedHouseholds}
              </span>
            </button>
            <button
              onClick={() => setCeremonyFilter('MANDAP_UNASSIGNED')}
              className={`px-3 py-1.5 rounded-full font-medium transition-all border flex items-center gap-1.5 ${
                ceremonyFilter === 'MANDAP_UNASSIGNED'
                  ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              <span>⏳ Not Assigned</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-[10px] font-bold">
                {mandapUnassignedHouseholds}
              </span>
            </button>
          </div>

          {/* Conditional Bulk Actions Bar */}
          {selectedGuestIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-primary-fixed/20 border border-primary/30 px-4 py-3 rounded-lg text-on-primary-fixed shadow-xs gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                <span className="font-bold text-primary">
                  {selectedGuestIds.length} Royal Households Selected
                </span>
                <span className="text-on-surface-variant">({totalPaxSelected} total esteemed pax)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {showArchived ? (
                  <button
                    disabled={isBulkProcessing}
                    onClick={() => handleBulkAction('UNARCHIVE')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore to Active Roll</span>
                  </button>
                ) : (
                  <>
                    <button
                      disabled={isBulkProcessing}
                      onClick={() => handleBulkAction('ASSIGN_CEREMONY')}
                      className="px-3 py-1.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded text-xs font-semibold hover:bg-surface-container shadow-xs"
                    >
                      Assign Mandap Seating
                    </button>
                    <button
                      disabled={isBulkProcessing}
                      onClick={() => handleBulkAction('DISPATCH_WHATSAPP')}
                      className="px-3 py-1.5 bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded text-xs font-semibold hover:bg-surface-container shadow-xs"
                    >
                      Dispatch WhatsApp Pass
                    </button>
                    <button
                      disabled={isBulkProcessing}
                      onClick={() => handleBulkAction('ARCHIVE')}
                      className="px-3 py-1.5 bg-surface-container-lowest text-secondary border border-secondary/30 rounded text-xs font-semibold hover:bg-surface-container shadow-xs"
                    >
                      Archive
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 5. High-Density Guest Registry Table */}
        <section className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-md overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={displayedGuests.length > 0 && selectedGuestIds.length === displayedGuests.length}
                      onChange={handleSelectAll}
                      className="rounded accent-secondary h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Noble Guest &amp; Household</th>
                  <th className="py-3.5 px-4">Court &amp; Circle</th>
                  <th className="py-3.5 px-4">Logistics &amp; Contact</th>
                  <th className="py-3.5 px-4">Dietary Mandate</th>
                  <th className="py-3.5 px-4">Ceremonial Access</th>
                  <th className="py-3.5 px-4">RSVP Status</th>
                  <th className="py-3.5 px-4 text-right">Concierge Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs text-on-surface">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                      <p>Consulting royal chancery roll...</p>
                    </td>
                  </tr>
                ) : displayedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                      <p className="font-semibold text-sm">No noble households found matching your current filter</p>
                      <button
                        onClick={() => {
                          setCeremonyFilter('ALL');
                          setSelectedSide('ALL');
                          setSelectedCategory('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold"
                      >
                        Reset Chancery Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayedGuests.map((guest) => {
                    const m = guest.metadata || {};
                    const isSelected = selectedGuestIds.includes(guest.id);
                    const initials = `${guest.firstName?.[0] || ''}${guest.lastName?.[0] || ''}`.toUpperCase() || 'RG';
                    const pax = Number(m.paxCount) || 1;
                    const rsvp = m.rsvpStatus || 'AWAITING';

                    // Side styling
                    const isBride = guest.side === 'BRIDE';
                    const isGroom = guest.side === 'GROOM';

                    return (
                      <tr
                        key={guest.id}
                        className={`hover:bg-surface-container-low/60 transition-colors ${
                          isSelected ? 'bg-primary-fixed/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(guest.id)}
                            className="rounded accent-secondary h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Guest & Household */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                                isBride
                                  ? 'bg-secondary'
                                  : isGroom
                                  ? 'bg-primary'
                                  : 'bg-surface-container-highest text-on-surface'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-on-surface leading-tight">
                                {m.honorific ? `${m.honorific} ` : ''}
                                {guest.firstName} {guest.lastName || ''}
                              </span>
                              <span className="text-[11px] text-on-surface-variant mt-0.5">
                                {m.householdRole === 'SOLO' ? 'Solo Dignitary' : 'Head of Household'} •{' '}
                                <strong className="text-primary font-semibold">{pax} Pax</strong>
                                {m.companions && m.companions.length > 0 && (
                                  <span
                                    onClick={() => {
                                      setInspectingGuest(guest);
                                    }}
                                    className="ml-1 text-secondary underline cursor-pointer"
                                  >
                                    ({m.companions.length} companions)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Court & Circle */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBride
                                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                                  : isGroom
                                  ? 'bg-primary-fixed text-on-primary-fixed'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {isBride ? "Bride's Court" : isGroom ? "Groom's Baraat" : 'Mutual Court'}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {guest.category?.name || 'Noble Guest'}
                            </span>
                          </div>
                        </td>

                        {/* Logistics & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-medium text-on-surface">
                              <span>{guest.phone || 'No phone'}</span>
                              {guest.phone && (
                                <button
                                  onClick={() => openWhatsApp(guest.phone, guest.displayName)}
                                  title="Send WhatsApp Note"
                                  className="text-primary hover:text-primary-container"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant">
                              {m.city || 'City not stated'} • {m.allocatedSuite || 'Suite unassigned'}
                            </span>
                          </div>
                        </td>

                        {/* Dietary Mandate */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded text-[11px] font-semibold text-primary">
                            {m.dietaryLabel || m.dietary || 'Pure Vegetarian'}
                          </span>
                        </td>

                        {/* Ceremonial Access */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            {events.map((ev) => {
                              const isInvited = guest.guestEvents?.some((ge) => ge.eventId === ev.id);
                              const isMandap = ev.id === vivahaEvent?.id;
                              const letter = ev.name?.[0] || 'C';
                              return (
                                <span
                                  key={ev.id}
                                  title={`${ev.name}: ${isInvited ? 'INVITED / ASSIGNED ✓' : 'NOT INVITED ✕'}${isMandap ? ' (Mandap Seating)' : ''}`}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    isInvited
                                      ? isMandap
                                        ? 'bg-secondary text-white shadow-xs ring-1 ring-secondary/50 font-black'
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

                        {/* RSVP Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                                rsvp === 'ATTENDING'
                                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                                  : rsvp === 'DECLINED'
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-tertiary-fixed text-on-tertiary-fixed'
                              }`}
                            >
                              {rsvp === 'ATTENDING' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Attending ({pax})
                                </>
                              ) : rsvp === 'DECLINED' ? (
                                <>Declined</>
                              ) : (
                                <>
                                  <Hourglass className="w-3 h-3" /> Awaiting ({pax})
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => {
                                setInspectingGuest(guest);
                                setIsPassModalOpen(true);
                              }}
                              title="Inspect QR Imperial Pass"
                              className="text-primary hover:scale-110 transition-transform"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-on-surface-variant">
                            {showArchived ? (
                              <button
                                onClick={() => handleUnarchiveGuest(guest.id, guest.displayName)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary-container text-on-primary-container font-semibold hover:opacity-90 shadow-xs text-[11px]"
                                title="Unarchive & Restore to Active Roll"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Unarchive</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenEditDrawer(guest)}
                                  className="p-1.5 rounded hover:bg-surface-container text-on-surface transition-colors"
                                  title="Edit Noble Guest"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGuest(guest.id, guest.displayName)}
                                  className="p-1.5 rounded hover:bg-surface-container text-secondary transition-colors"
                                  title="Chancery Archive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-surface-container-low text-on-surface-variant text-xs font-medium border-t border-outline-variant/30">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <span>
                Showing <strong>{displayedGuests.length}</strong> of <strong>{guests.length} Households</strong>
                {ceremonyFilter !== 'ALL' && (
                  <span className="ml-1 text-secondary font-semibold">
                    ({ceremonyFilter === 'MANDAP_ASSIGNED' ? 'Mandap Seated' : 'Mandap Unassigned'})
                  </span>
                )}
              </span>
              <span className="text-outline-variant font-light">|</span>
              <span className="text-primary font-semibold">{telemetry?.totalGuests || 0} Total Guests</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-on-surface-variant">Page 1 of 1</span>
            </div>
          </div>
        </section>
      </div>

      {/* 6. Luxury Slide-Over Enrollment Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl h-full bg-surface-container-lowest shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-outline-variant/40 animate-slideInRight">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-surface-container-low flex items-start justify-between sticky top-0 z-20 border-b border-outline-variant/30">
              <div>
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold tracking-widest uppercase mb-1">
                  <Sparkles className="w-4 h-4 text-primary fill-primary" />
                  <span>Chancery Protocol Registry</span>
                </div>
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  {editingGuest ? 'Edit Royal Guest Record' : 'Enroll Royal Guest & Household'}
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Register esteemed kin, define dietary guidelines, and issue digital imperial seals.
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSubmitDrawer} className="p-6 flex flex-col gap-6 flex-1 text-xs">
              {/* Section 1: Sovereign Identity */}
              <div className="flex flex-col gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  1. Sovereign Identity &amp; Title
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Honorific</label>
                    <select
                      value={honorific}
                      onChange={(e) => setHonorific(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    >
                      <option>Maharaj</option>
                      <option>Maharani</option>
                      <option>Thakur</option>
                      <option>Yuvraj</option>
                      <option>Rajkumar</option>
                      <option>Dr.</option>
                      <option>Justice</option>
                      <option>Shri</option>
                      <option>Smt.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-on-surface-variant mb-1 font-medium">First / Noble Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Vikramaditya"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Last Name / Clan</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Ranawat / Rathore"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Circle / Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Court Affiliation Selector */}
                <div>
                  <label className="block text-on-surface-variant mb-1 font-medium">Court Affiliation</label>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <label
                      onClick={() => setSide('GROOM')}
                      className={`flex flex-col items-center p-2.5 rounded-lg border cursor-pointer transition-all ${
                        side === 'GROOM'
                          ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      <span>Groom's Baraat</span>
                      <span className="text-[10px] opacity-80">(Ranawat)</span>
                    </label>

                    <label
                      onClick={() => setSide('BRIDE')}
                      className={`flex flex-col items-center p-2.5 rounded-lg border cursor-pointer transition-all ${
                        side === 'BRIDE'
                          ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      <span>Bride's Court</span>
                      <span className="text-[10px] opacity-80">(Rathore)</span>
                    </label>

                    <label
                      onClick={() => setSide('BOTH')}
                      className={`flex flex-col items-center p-2.5 rounded-lg border cursor-pointer transition-all ${
                        side === 'BOTH'
                          ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      <span>Mutual Dignitary</span>
                      <span className="text-[10px] opacity-80">(Honored)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Chauffeur Logistics */}
              <div className="flex flex-col gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  2. Chancery Contact &amp; Dispatch
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">WhatsApp Mobile (+91)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98290 12345"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Primary Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="noble@palace.in"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Native City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Jodhpur, Rajasthan"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface-variant mb-1 font-medium">Assigned Palace Suite</label>
                    <input
                      type="text"
                      value={allocatedSuite}
                      onChange={(e) => setAllocatedSuite(e.target.value)}
                      placeholder="e.g. Lake View Suite #204"
                      className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Household Kin Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-primary">
                    3. Household Pax &amp; Companions ({1 + companions.length} Pax Total)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCompanion}
                    className="text-secondary font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Kin Member
                  </button>
                </div>

                <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between font-medium text-on-surface">
                    <span>Primary Guest (Head)</span>
                    <span className="text-primary font-semibold">Seat 1</span>
                  </div>
                  <input
                    disabled
                    value={`${firstName} ${lastName}`.trim() || 'Noble Primary Guest'}
                    className="w-full bg-surface-container-lowest text-on-surface-variant p-2 rounded text-xs border border-outline-variant/20"
                  />
                </div>

                {companions.map((comp, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-on-surface">Companion {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompanion(idx)}
                        className="text-error hover:underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={comp.name}
                        onChange={(e) => handleUpdateCompanion(idx, 'name', e.target.value)}
                        className="bg-surface-container-lowest text-on-surface p-2 rounded text-xs border border-outline-variant/30"
                      />
                      <input
                        type="text"
                        placeholder="Relation (e.g. Spouse / Child)"
                        value={comp.relation}
                        onChange={(e) => handleUpdateCompanion(idx, 'relation', e.target.value)}
                        className="bg-surface-container-lowest text-on-surface p-2 rounded text-xs border border-outline-variant/30"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 4: Dietary Mandate */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  4. Sacred Dietary Mandate
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'JAIN', label: '🌿 Jain Saatvik (No Root)' },
                    { id: 'PURE_VEG', label: '🥦 Pure Vegetarian' },
                    { id: 'NON_VEG', label: '🍗 Multi-Cuisine / Non-Veg' },
                    { id: 'GLUTEN_FREE', label: '🌾 Gluten-Free / Vegan' },
                  ].map((dietOpt) => (
                    <label
                      key={dietOpt.id}
                      onClick={() => setDietary(dietOpt.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        dietary === dietOpt.id
                          ? 'bg-primary-container/20 border-primary font-bold text-primary'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dietary"
                        checked={dietary === dietOpt.id}
                        onChange={() => setDietary(dietOpt.id)}
                        className="accent-secondary"
                      />
                      <span>{dietOpt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-2">
                  <label className="block text-on-surface-variant mb-1 font-medium">Allergy Alert (Optional)</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Severe Peanut / Tree Nut Allergy"
                    className="w-full bg-surface-container-low text-on-surface p-2.5 rounded-lg border border-outline-variant/40 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Section 5: Ceremonial Enclave Access */}
              <div className="flex flex-col gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  5. Ceremonial Enclave Access
                </span>
                <div className="flex flex-col gap-2">
                  {events.map((ev) => {
                    const isChecked = selectedEventIds.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        onClick={() => handleToggleEvent(ev.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-primary-container/15 border-primary/40'
                            : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface text-xs">{ev.name}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            {ev.settings?.locationName || 'Main Palace Enclave'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEvent(ev.id)}
                          className="accent-secondary h-4 w-4"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 6: RSVP Initial Status */}
              <div>
                <label className="block text-on-surface-variant mb-1 font-medium">RSVP Current Status</label>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('ATTENDING')}
                    className={`py-2 rounded-lg border font-semibold ${
                      rsvpStatus === 'ATTENDING'
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    ✓ Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('AWAITING')}
                    className={`py-2 rounded-lg border font-semibold ${
                      rsvpStatus === 'AWAITING'
                        ? 'bg-tertiary-container text-white border-tertiary-container'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    ⏳ Awaiting
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpStatus('DECLINED')}
                    className={`py-2 rounded-lg border font-semibold ${
                      rsvpStatus === 'DECLINED'
                        ? 'bg-error text-white border-error'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    ✕ Declined
                  </button>
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-end gap-3 sticky bottom-0 -mx-6 -mb-6 border-t border-outline-variant/30 shadow-md">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 text-xs font-semibold uppercase tracking-wider"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Confirm & Dispatch Pass'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal for Digital QR Pass & Household Inspection */}
      {isPassModalOpen && inspectingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl border border-primary/30 shadow-2xl overflow-hidden p-6 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Imperial Wedding Pass
              </span>
              <button
                onClick={() => setIsPassModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-inner border border-outline-variant/40 flex flex-col items-center">
              <QrCode className="w-40 h-40 text-primary stroke-[1.5]" />
              <span className="font-mono text-xs font-bold text-primary mt-2">
                {inspectingGuest.metadata?.qrPassCode || 'MMM-ROYAL-PASS'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-headline-md text-lg font-bold text-on-surface">
                {inspectingGuest.displayName}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {inspectingGuest.metadata?.householdName || 'Royal Household'} •{' '}
                <strong className="text-primary">{inspectingGuest.metadata?.paxCount || 1} Pax Attending</strong>
              </p>
              <p className="text-xs text-secondary font-medium">
                {inspectingGuest.metadata?.allocatedSuite || 'Taj Lake Palace, Udaipur'}
              </p>
            </div>

            <button
              onClick={() => {
                openWhatsApp(inspectingGuest.phone, inspectingGuest.displayName);
                setIsPassModalOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Pass via WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. Modal for Companions Inspection */}
      {inspectingGuest && !isPassModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-outline-variant/30 shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                {inspectingGuest.displayName} — Household Roll
              </h3>
              <button
                onClick={() => setInspectingGuest(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 divide-y divide-outline-variant/20 text-xs">
              <div className="py-2 flex items-center justify-between font-medium">
                <div>
                  <span className="font-bold text-on-surface">{inspectingGuest.displayName}</span>
                  <span className="text-on-surface-variant ml-2">(Primary Head)</span>
                </div>
                <span className="text-primary font-semibold">
                  {inspectingGuest.metadata?.dietaryLabel || inspectingGuest.metadata?.dietary || 'Pure Veg'}
                </span>
              </div>

              {inspectingGuest.metadata?.companions?.map((c, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface">{c.name}</span>
                    <span className="text-on-surface-variant ml-2">({c.relation})</span>
                  </div>
                  <span className="text-secondary font-medium">{c.dietary || 'Pure Veg'}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setInspectingGuest(null)}
              className="mt-2 py-2 bg-surface-container-low text-on-surface rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
