import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWedding } from '../../context/WeddingContext';
import {
  rsvpService,
  RsvpTelemetry,
  GuestRsvpResponseItem,
  RsvpStatusType,
  ManualRsvpPayload,
} from '../../services/rsvp.service';
import { Card } from '../../components/ui/Card';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  UtensilsCrossed,
  Hotel,
  Car,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Edit,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const DIETARY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  PURE_VEG: { label: 'Pure Veg Satvik', icon: '🌿', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  JAIN: { label: 'Jain Saatvik', icon: '🪷', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  NON_VEG: { label: 'Standard Royal Feast', icon: '🍗', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  VEGAN: { label: 'Vegan Plant-Based', icon: '🌱', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  GLUTEN_FREE: { label: 'Gluten Conscious', icon: '🌾', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  OTHER: { label: 'Special Preference', icon: '🍽️', color: 'bg-purple-50 text-purple-800 border-purple-200' },
};

export const RsvpCommandView: React.FC = () => {
  const { currentWedding } = useWedding();
  const { weddingId: routeWeddingId } = useParams<{ weddingId?: string }>();
  const activeWeddingId = routeWeddingId || currentWedding?.id;

  const [telemetry, setTelemetry] = useState<RsvpTelemetry | null>(null);
  const [guests, setGuests] = useState<GuestRsvpResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'AWAITING' | 'DECLINED' | 'SPECIAL_DIETARY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual RSVP Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuestForEdit, setSelectedGuestForEdit] = useState<GuestRsvpResponseItem | null>(null);
  const [modalStatus, setModalStatus] = useState<RsvpStatusType>('ATTENDING');
  const [modalPax, setModalPax] = useState<number>(1);
  const [modalDietary, setModalDietary] = useState<string>('PURE_VEG');
  const [modalAllergies, setModalAllergies] = useState<string>('');
  const [modalAccommodation, setModalAccommodation] = useState<boolean>(false);
  const [modalTransportation, setModalTransportation] = useState<boolean>(false);
  const [modalTransportationDetails, setModalTransportationDetails] = useState<string>('');
  const [modalBlessing, setModalBlessing] = useState<string>('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const loadData = async (showRefreshIndicator = false) => {
    if (!activeWeddingId) return;
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [telemetryData, guestList] = await Promise.all([
        rsvpService.getRsvpTelemetry(activeWeddingId),
        rsvpService.getRsvps(activeWeddingId, { status: activeTab, search: searchQuery || undefined }),
      ]);
      setTelemetry(telemetryData);
      setGuests(guestList);
    } catch (err) {
      console.error('Failed to load RSVP telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWeddingId, activeTab]);

  // Handle Search Debounce / Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeWeddingId) {
        rsvpService.getRsvps(activeWeddingId, { status: activeTab, search: searchQuery || undefined })
          .then(setGuests)
          .catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Edit Modal for a Guest
  const handleOpenEdit = (guest: GuestRsvpResponseItem) => {
    setSelectedGuestForEdit(guest);
    setModalStatus(guest.overallStatus === 'NOT_ATTENDING' ? 'NOT_ATTENDING' : 'ATTENDING');
    setModalPax(guest.rsvpPax > 0 ? guest.rsvpPax : (guest.paxCount || 1));
    setModalDietary(guest.dietary || 'PURE_VEG');
    setModalAllergies(guest.allergies || '');
    setModalAccommodation(Boolean(guest.accommodationRequired));
    setModalTransportation(Boolean(guest.transportationRequired));
    setModalTransportationDetails(guest.transportationDetails || '');
    setModalBlessing(guest.blessingMessage || '');
    setIsModalOpen(true);
  };

  // Submit Manual RSVP
  const handleSaveManualRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeddingId || !selectedGuestForEdit) return;

    setIsSavingManual(true);
    try {
      const payload: ManualRsvpPayload = {
        guestId: selectedGuestForEdit.guestId,
        overallStatus: modalStatus,
        attendeeCount: modalStatus === 'NOT_ATTENDING' ? 0 : modalPax,
        foodPreference: modalDietary,
        allergies: modalAllergies.trim() || undefined,
        accommodationRequired: modalAccommodation,
        transportationRequired: modalTransportation,
        transportationDetails: modalTransportation ? modalTransportationDetails.trim() : undefined,
        message: modalBlessing.trim() || undefined,
      };

      await rsvpService.submitManualRsvp(activeWeddingId, payload);
      setIsModalOpen(false);
      setSelectedGuestForEdit(null);
      await loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record manual RSVP.');
    } finally {
      setIsSavingManual(false);
    }
  };

  // Export Catering CSV
  const handleExportCsv = () => {
    if (!guests || guests.length === 0) {
      alert('No guest RSVP records to export.');
      return;
    }

    const headers = [
      'Guest Name',
      'Household',
      'Side',
      'RSVP Status',
      'Confirmed Pax',
      'Dietary Mandate',
      'Allergies / Special Requests',
      'Palace Suite Required',
      'Chauffeur Pickup Required',
      'Transit Details',
      'Heartfelt Blessings',
      'Responded At',
    ];

    const rows = guests.map((g) => [
      `"${g.displayName.replace(/"/g, '""')}"`,
      `"${g.householdName.replace(/"/g, '""')}"`,
      `"${g.side}"`,
      `"${g.overallStatus}"`,
      g.rsvpPax,
      `"${g.dietary}"`,
      `"${(g.allergies || '').replace(/"/g, '""')}"`,
      g.accommodationRequired ? 'YES' : 'NO',
      g.transportationRequired ? 'YES' : 'NO',
      `"${(g.transportationDetails || '').replace(/"/g, '""')}"`,
      `"${(g.blessingMessage || '').replace(/"/g, '""')}"`,
      `"${g.respondedAt ? new Date(g.respondedAt).toLocaleDateString() : 'Awaiting'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Catering_Banquet_Manifest_${currentWedding?.name || 'Wedding'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract allergy alerts list
  const allergyAlerts = useMemo(() => {
    return guests.filter((g) => g.allergies && g.allergies.trim().length > 0 && g.overallStatus === 'ATTENDING');
  }, [guests]);

  if (isLoading && !telemetry) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-serif text-stone-600">Gathering Imperial RSVP Telemetry...</p>
      </div>
    );
  }

  const responseRate = telemetry?.responseRatePercentage || 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Imperial Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Section 116 • Royal Banquet Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            RSVP &amp; Banquet Attendance Command
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Monitor real-time ritual headcounts, satvik banquet mandates, and dignitary quarters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Catering Manifest</span>
          </button>

          <button
            onClick={() => {
              if (guests.length > 0) {
                handleOpenEdit(guests[0]);
              } else {
                alert('No guests registered yet in this wedding.');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Manual RSVP</span>
          </button>
        </div>
      </div>

      {/* 4 Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invited */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-stone-500 bg-gradient-to-br from-white to-stone-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Invited</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {telemetry?.totalInvitedPax ?? 0}
            </span>
            <span className="text-xs text-stone-500 font-medium">pax invited</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-500">
            Across {telemetry?.totalHouseholds ?? 0} royal households
          </div>
        </Card>

        {/* Confirmed Attending */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-emerald-600 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Confirmed Attending</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-900">
              {telemetry?.confirmedPax ?? 0}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {responseRate}% responded
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700">
            {telemetry?.respondedHouseholds ?? 0} of {telemetry?.totalHouseholds ?? 0} households confirmed
          </div>
        </Card>

        {/* Awaiting Response */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Awaiting Response</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-900">
              {telemetry?.awaitingPax ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">pending pax</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700">
            Reminders can be sent via WhatsApp
          </div>
        </Card>

        {/* Regretfully Declined */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-rose-500 bg-gradient-to-br from-white to-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Regretfully Declined</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-rose-900">
              {telemetry?.declinedPax ?? 0}
            </span>
            <span className="text-xs text-rose-500 font-medium">declined pax</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-700">
            Seats released back to inventory
          </div>
        </Card>
      </div>

      {/* Ritual Catering Breakdown Rail */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Ritual Catering &amp; Headcount Breakdown
              </h3>
              <p className="text-xs text-stone-500">
                Attendance numbers allocated per sacred wedding ceremony
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-stone-500">
            {telemetry?.ceremonyHeadcounts.length || 0} Ceremonies Scheduled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {telemetry?.ceremonyHeadcounts.map((c) => {
            const total = telemetry.totalInvitedPax || 1;
            const pct = Math.min(100, Math.round((c.attendingPax / total) * 100));
            return (
              <div
                key={c.eventId}
                className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      <span>{c.eventName}</span>
                      {c.isMandap && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Mandap VIP
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                      <span>{c.venueName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-serif font-bold text-primary">
                      {c.attendingPax}
                    </span>
                    <span className="text-[10px] text-stone-500 block">Attending</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                    <span>{pct}% of invited</span>
                    <span>Target: {total}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Banquet Dietary Tally & Hospitality Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chef's Banquet Dietary Tally (2 cols wide on large) */}
        <Card className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Chef's Banquet Dietary Tally
                </h3>
                <p className="text-xs text-stone-500">
                  Kitchen order manifest for executive royal caterers
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {telemetry?.confirmedPax || 0} Confirmed Plates
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
              <span className="text-lg">🌿</span>
              <div className="text-xl font-bold font-serif mt-1">
                {telemetry?.dietaryBreakdown.pureVeg ?? 0}
              </div>
              <div className="text-xs font-bold text-emerald-800">Pure Veg Satvik</div>
              <div className="text-[10px] text-emerald-700">Traditional vegetarian</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
              <span className="text-lg">🪷</span>
              <div className="text-xl font-bold font-serif mt-1">
                {telemetry?.dietaryBreakdown.jain ?? 0}
              </div>
              <div className="text-xs font-bold text-amber-800">Jain Saatvik</div>
              <div className="text-[10px] text-amber-700">No onion/garlic/roots</div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950">
              <span className="text-lg">🍗</span>
              <div className="text-xl font-bold font-serif mt-1">
                {telemetry?.dietaryBreakdown.nonVeg ?? 0}
              </div>
              <div className="text-xs font-bold text-rose-800">Royal Feast (Non-Veg)</div>
              <div className="text-[10px] text-rose-700">Awadhi &amp; Mughlai mains</div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950">
              <span className="text-base">🌱</span>
              <div className="text-lg font-bold font-serif mt-0.5">
                {telemetry?.dietaryBreakdown.vegan ?? 0}
              </div>
              <div className="text-xs font-bold text-teal-800">Plant-Based Vegan</div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-950">
              <span className="text-base">🌾</span>
              <div className="text-lg font-bold font-serif mt-0.5">
                {telemetry?.dietaryBreakdown.glutenFree ?? 0}
              </div>
              <div className="text-xs font-bold text-sky-800">Gluten-Free</div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950">
              <span className="text-base">🍽️</span>
              <div className="text-lg font-bold font-serif mt-0.5">
                {telemetry?.dietaryBreakdown.other ?? 0}
              </div>
              <div className="text-xs font-bold text-purple-800">Special Requests</div>
            </div>
          </div>

          {/* Allergy Alerts Banner */}
          {allergyAlerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Chef's Critical Allergy Flags ({allergyAlerts.length} Guests)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {allergyAlerts.map((g) => (
                  <div key={g.id} className="p-2 rounded-lg bg-white/80 border border-rose-200">
                    <span className="font-bold text-stone-900">{g.displayName}: </span>
                    <span className="text-rose-700 italic">"{g.allergies}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Hospitality & Quarters Logistics (1 col wide) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Hotel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Hospitality &amp; Transit
              </h3>
              <p className="text-xs text-stone-500">
                Estate guest wing &amp; chauffeur needs
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Palace Suite Quarters</div>
                  <div className="text-[11px] text-stone-500">Estate accommodation requested</div>
                </div>
              </div>
              <span className="text-xl font-bold font-serif text-secondary">
                {telemetry?.hospitality.accommodationCount ?? 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Airport &amp; Transit Chauffeur</div>
                  <div className="text-[11px] text-stone-500">Udaipur airport / station pickup</div>
                </div>
              </div>
              <span className="text-xl font-bold font-serif text-primary">
                {telemetry?.hospitality.transportationCount ?? 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>Royal Concierge Tip:</strong> Coordinate guest wing room allocations in the Guest Directory to automatically tag suite keys.
          </div>
        </Card>
      </div>

      {/* Guest Manifest Table Section */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Interactive RSVP Manifest
            </h3>
            <p className="text-xs text-stone-500">
              Browse, filter, and manually update responses from any wedding dignitary
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, household..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: 'All Guests', count: guests.length },
            { id: 'CONFIRMED', label: 'Confirmed Attending' },
            { id: 'AWAITING', label: 'Awaiting Response' },
            { id: 'DECLINED', label: 'Declined' },
            { id: 'SPECIAL_DIETARY', label: 'Special Dietary' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Manifest Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Dignitary &amp; Household</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4 text-center">Pax</th>
                <th className="py-3 px-4">Dietary Mandate</th>
                <th className="py-3 px-4">Logistics</th>
                <th className="py-3 px-4">Blessings / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400 italic">
                    No guest RSVP records found matching your filter.
                  </td>
                </tr>
              ) : (
                guests.map((g) => {
                  const dietInfo = DIETARY_LABELS[g.dietary] || DIETARY_LABELS.PURE_VEG;
                  return (
                    <tr key={g.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Name & Household */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{g.displayName}</div>
                        <div className="text-[11px] text-stone-500">{g.householdName}</div>
                      </td>

                      {/* Side */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          g.side === 'GROOM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {g.side}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {g.overallStatus === 'ATTENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Confirmed
                          </span>
                        ) : g.overallStatus === 'NOT_ATTENDING' || g.overallStatus === 'DECLINED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Declined
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Awaiting
                          </span>
                        )}
                      </td>

                      {/* Pax */}
                      <td className="py-3 px-4 text-center font-bold text-stone-800">
                        {g.overallStatus === 'ATTENDING' ? (
                          <span className="text-emerald-700">{g.rsvpPax} / {g.paxCount}</span>
                        ) : (
                          <span className="text-stone-400">0 / {g.paxCount}</span>
                        )}
                      </td>

                      {/* Dietary */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${dietInfo.color}`}>
                          <span>{dietInfo.icon}</span>
                          <span>{dietInfo.label}</span>
                        </span>
                        {g.allergies && (
                          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                            ⚠️ {g.allergies}
                          </div>
                        )}
                      </td>

                      {/* Logistics */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {g.accommodationRequired && (
                            <span className="p-1 rounded bg-secondary/15 text-secondary" title="Suite Quarters Needed">
                              <Hotel className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {g.transportationRequired && (
                            <span className="p-1 rounded bg-primary/15 text-primary" title={`Chauffeur Needed: ${g.transportationDetails || 'Airport Pickup'}`}>
                              <Car className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {!g.accommodationRequired && !g.transportationRequired && (
                            <span className="text-[11px] text-stone-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Blessings Note */}
                      <td className="py-3 px-4 max-w-xs">
                        {g.blessingMessage ? (
                          <div className="truncate text-[11px] text-stone-600 italic" title={g.blessingMessage}>
                            "{g.blessingMessage}"
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit className="w-3 h-3 text-stone-500" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual RSVP Entry / Edit Modal */}
      {isModalOpen && selectedGuestForEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Record Royal RSVP
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedGuestForEdit.displayName} • {selectedGuestForEdit.householdName}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveManualRsvp} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Overall Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Attendance Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatus('ATTENDING')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      modalStatus === 'ATTENDING'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attending</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatus('NOT_ATTENDING')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      modalStatus === 'NOT_ATTENDING'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Declined</span>
                  </button>
                </div>
              </div>

              {modalStatus === 'ATTENDING' && (
                <>
                  {/* Pax Headcount Stepper */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">Confirmed Pax</span>
                      <span className="text-[11px] text-stone-500">Max invited: {selectedGuestForEdit.paxCount}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setModalPax((p) => Math.max(1, p - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-base text-primary">
                        {modalPax}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalPax((p) => p + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 font-bold text-stone-800 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dietary Preference */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Dietary Mandate
                    </label>
                    <select
                      value={modalDietary}
                      onChange={(e) => setModalDietary(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="PURE_VEG">Pure Veg Satvik</option>
                      <option value="JAIN">Jain Saatvik (No root veggies)</option>
                      <option value="NON_VEG">Royal Feast (Standard Non-Veg)</option>
                      <option value="VEGAN">Plant-Based Vegan</option>
                      <option value="GLUTEN_FREE">Gluten Conscious</option>
                      <option value="OTHER">Other / Special</option>
                    </select>
                  </div>

                  {/* Allergy Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Allergy Notes / Food Restrictions
                    </label>
                    <input
                      type="text"
                      value={modalAllergies}
                      onChange={(e) => setModalAllergies(e.target.value)}
                      placeholder="e.g. Peanut allergy, severe shellfish..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Logistics Checkboxes */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalAccommodation}
                        onChange={(e) => setModalAccommodation(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Palace Suite Accommodation Needed</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalTransportation}
                        onChange={(e) => setModalTransportation(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Airport / Chauffeur Pickup Needed</span>
                    </label>

                    {modalTransportation && (
                      <input
                        type="text"
                        value={modalTransportationDetails}
                        onChange={(e) => setModalTransportationDetails(e.target.value)}
                        placeholder="Flight details, train arrival time..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Blessing Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Blessings &amp; Notes
                </label>
                <textarea
                  value={modalBlessing}
                  onChange={(e) => setModalBlessing(e.target.value)}
                  rows={2}
                  placeholder="Notes from guest or warm wishes..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingManual ? 'Saving...' : 'Save RSVP Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
