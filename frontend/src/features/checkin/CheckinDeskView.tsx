import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  QrCode,
  CheckCircle,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Flashlight,
  Camera,
  Users,
  UtensilsCrossed,
  Crown,
  Search,
  RefreshCw,
  Download,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Check,
  UserCheck,
} from 'lucide-react';
import {
  checkinService,
  GuestVerificationDossier,
  CheckInTelemetry,
  CheckInLedgerItem,
} from '../../services/checkin.service';
import { useWedding } from '../../context/WeddingContext';

export const CheckinDeskView: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { currentWedding } = useWedding();
  const activeWeddingId = weddingId || currentWedding?.id || 'f238b9ec-9c7f-41d3-8885-0080ae24a462';

  // Audio & Hardware states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [activeGate, setActiveGate] = useState('Gate 1 — Royal Porch');
  const [selectedCeremony, setSelectedCeremony] = useState('Sacred Muhurtham • Grand Mandap Lawn');

  // Scanner & Search states
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [laserPos, setLaserPos] = useState(25);

  // Verification Dossier state
  const [dossier, setDossier] = useState<GuestVerificationDossier>({
    status: 'ACCESS_GRANTED',
    guestId: 'demo-guest-9821',
    name: 'Dr. Vikramaditya Rathore & Family',
    initials: 'VR',
    title: 'Senior Surgeon, Mewar Medical Council',
    category: "VIP Dignitary • Groom's Family Side",
    isVip: true,
    phone: '+91 98290 14412',
    passToken: 'MM-VIV-9821',
    headcount: 3,
    companions: ['Mrs. Sunita Rathore', 'Aryan Rathore'],
    assignedTable: 'Table 4 — Peacock Pavilion',
    zone: 'Grand Mandap Front View • Zone A',
    foodPreference: 'Strict Jain (No Onion / Garlic / Root Vegetables)',
    dietaryNotes: 'Strict Jain — 2 Meals, 1 Regular Vegetarian',
  });

  // Telemetry & Ledger states
  const [telemetry, setTelemetry] = useState<CheckInTelemetry | null>(null);
  const [ledger, setLedger] = useState<CheckInLedgerItem[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'vip' | 'dietary' | 'warning'>('all');

  // Modals & HUD Toast
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isStandeeOpen, setIsStandeeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; isSuccess: boolean } | null>(null);

  // Walk-in form
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInCount, setWalkInCount] = useState(1);
  const [walkInTable, setWalkInTable] = useState('Table 4');
  const [walkInFood, setWalkInFood] = useState('Traditional Royal Rajasthani Vegetarian');

  // Web Audio Synthesizer for gate clearance chime
  const playSound = (success = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio fallback or muted
    }
  };

  const showToast = (title: string, desc: string, isSuccess = true) => {
    setToastMessage({ title, desc, isSuccess });
    playSound(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Laser scanner animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setLaserPos((prev) => (prev === 25 ? 75 : 25));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial telemetry and ledger
  const loadData = async () => {
    if (!activeWeddingId) return;
    try {
      const [tStats, lItems] = await Promise.all([
        checkinService.getTelemetry(activeWeddingId),
        checkinService.getLedger(activeWeddingId, ledgerFilter),
      ]);
      setTelemetry(tStats);
      setLedger(lItems);
    } catch (err) {
      console.error('Failed to load check-in data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWeddingId, ledgerFilter]);

  // Handle Manual or Scanned Verification
  const handleVerify = async (code: string) => {
    if (!code.trim()) return;
    try {
      setIsScanning(true);
      const res = await checkinService.scanPass(activeWeddingId, {
        qrToken: code,
        manualCode: code,
        gateName: activeGate,
      });
      setDossier(res);

      if (res.status === 'ACCESS_GRANTED') {
        showToast('Pass Authenticated', `${res.name} cleared for entry`, true);
      } else if (res.status === 'ALREADY_CHECKED_IN') {
        showToast('Duplicate Pass Warning', res.warningMessage || 'Pass already scanned previously', false);
      } else {
        showToast('Unrecognized Token', 'Pass code not found in guest registry', false);
      }
    } catch (err: any) {
      showToast('Scan Error', err?.message || 'Verification failed', false);
    } finally {
      setIsScanning(false);
    }
  };

  // Confirm Check-in action
  const handleConfirmEntry = async () => {
    if (!dossier || dossier.status === 'ALREADY_CHECKED_IN') return;
    try {
      const result = await checkinService.confirmCheckIn(activeWeddingId, {
        guestId: dossier.guestId,
        attendeeCount: dossier.headcount,
        gateName: activeGate,
        usherName: 'Muni Reddy',
      });

      if (result.isDuplicate) {
        showToast('Already Checked In', 'Entry was previously recorded', false);
      } else {
        showToast(
          'Entry Confirmed',
          `${dossier.name} (${dossier.headcount} Guests) welcomed to ${dossier.assignedTable}`,
          true
        );
        // Refresh telemetry and ledger
        loadData();
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not record check-in', false);
    }
  };

  // Simulate Valid VIP Scan
  const handleSimulateVip = () => {
    handleVerify('9821');
  };

  // Simulate Duplicate Warning
  const handleSimulateDuplicate = () => {
    setDossier({
      status: 'ALREADY_CHECKED_IN',
      guestId: 'demo-dup-4412',
      name: 'Mrs. Manjula Devi Shekhawat',
      initials: 'MS',
      title: 'Honorary Member, Mewar Trust',
      category: 'VIP Royal Family Guest',
      isVip: true,
      phone: '+91 98291 88711',
      passToken: 'MM-VIV-4412',
      headcount: 2,
      companions: ['Harshvardhan Shekhawat'],
      assignedTable: 'Table 2 — Peacock Pavilion',
      zone: 'Grand Mandap Front View',
      foodPreference: 'Traditional Vegetarian',
      previousCheckIn: {
        checkedInAt: '19:42:15 PM',
        gateName: 'Gate 2 — Lake Promenade',
        usherName: 'Captain Shailesh Mehta',
      },
      warningMessage: 'Warning: This pass was authenticated at 19:42:15 PM at Gate 2. Anti-Passback protocol triggered.',
    });
    showToast('Duplicate Pass Flagged', 'Pass was already authenticated at Gate 2. Avoid duplicate entry.', false);
  };

  // Manual Walk-in Submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    try {
      await checkinService.manualWalkIn(activeWeddingId, {
        firstName: walkInName,
        phone: walkInPhone || undefined,
        tableNumber: walkInTable,
        attendeeCount: walkInCount,
        foodPreference: walkInFood,
        gateName: activeGate,
      });

      setIsWalkInOpen(false);
      setWalkInName('');
      setWalkInPhone('');
      showToast('Walk-in Registered', `${walkInName} welcomed to ${walkInTable}`, true);
      loadData();
    } catch (err: any) {
      showToast('Registration Error', err?.message || 'Could not register walk-in', false);
    }
  };

  // Export CSV Audit
  const handleExportCSV = () => {
    if (!ledger.length) return;
    const headers = 'Guest Name,Category,Headcount,Assigned Table,Gate,Usher,Checked In At,Status\n';
    const rows = ledger
      .map(
        (i) =>
          `"${i.guestName}","${i.category}","${i.headcount}","${i.assignedTable}","${i.gateName}","${i.usherName}","${i.checkedInAt}","${i.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gate_audit_checkin_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Exported', 'Gate check-in ledger downloaded successfully', true);
  };

  const coupleTitle = currentWedding?.name || 'Ananya & Rahul';

  return (
    <div className="w-full min-h-screen bg-[#FFF8F5] text-[#1E1B19] pb-24 selection:bg-[#F4BD6C] selection:text-[#291800]">
      {/* ========================================================================= */}
      {/* 0. INTERACTIVE FLOATING TOAST HUD                                          */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed top-24 right-6 sm:right-10 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white shadow-2xl border border-[#E9E1DD] animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              toastMessage.isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {toastMessage.isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-serif text-sm font-bold text-[#1E1B19]">{toastMessage.title}</p>
            <p className="text-xs text-[#827566] mt-0.5">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-stone-100 text-stone-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY COMMAND BAR                                     */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-6 border-b border-[#E9E1DD]/70 bg-white shadow-sm">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
          {/* Breadcrumb & Shloka Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#827566]">
              <span>Imperial Dashboard</span>
              <span className="text-[#D4AF37]">/</span>
              <span>Wedding Workspace</span>
              <span className="text-[#D4AF37]">/</span>
              <span className="text-[#780616] font-bold">VIP Gate Check-in & Banquet Access</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF2EE] border border-[#E9E1DD]">
              <span className="text-[#7F560C] text-xs font-serif">॥</span>
              <span className="font-serif text-xs font-semibold text-[#7F560C] tracking-wide">
                अतिथि देवो भव — Atithi Devo Bhava
              </span>
              <span className="text-[#7F560C] text-xs font-serif">॥</span>
            </div>
          </div>

          {/* Actionable Title Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B19] tracking-tight">
                  Imperial Gate & Concierge Desk
                </h1>
                <p className="text-xs sm:text-sm text-[#827566] mt-0.5">
                  Synchronized Royal Gate Terminal • Real-Time QR & Headcount Telemetry
                </p>
              </div>

              {/* Ceremony Selector Dropdown */}
              <div className="relative inline-block">
                <select
                  value={selectedCeremony}
                  onChange={(e) => setSelectedCeremony(e.target.value)}
                  className="appearance-none cursor-pointer bg-[#FAF2EE] pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold text-[#1E1B19] border border-[#E9E1DD] shadow-sm focus:outline-none focus:border-[#BF8E42]"
                >
                  <option>Sacred Muhurtham • Grand Mandap Lawn</option>
                  <option>Sangeet Night • Jagmandir Island Courtyard</option>
                  <option>Grand Royal Reception • Zenana Mahal</option>
                  <option>Haldi Radiance • Poolside Promenade</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500 text-xs">
                  ▼
                </span>
              </div>
            </div>

            {/* Terminal Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Real-Time SSE Stream Pulse */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E9E1DD] shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="text-xs font-bold text-[#1E1B19]">{activeGate}</span>
                <span className="text-[11px] text-[#827566] font-mono">14ms latency</span>
              </div>

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors shadow-sm ${
                  soundEnabled
                    ? 'bg-[#FAF2EE] border-[#BF8E42] text-[#7F560C]'
                    : 'bg-white border-[#E9E1DD] text-[#827566]'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Gate Switch Dropdown */}
              <select
                value={activeGate}
                onChange={(e) => setActiveGate(e.target.value)}
                className="bg-white px-3 py-2 rounded-xl border border-[#E9E1DD] text-xs font-semibold text-[#1E1B19] shadow-sm focus:outline-none"
              >
                <option value="Gate 1 — Royal Porch">Gate 1 — Royal Porch</option>
                <option value="Gate 2 — Lake Promenade">Gate 2 — Lake Promenade</option>
                <option value="VIP Mandap Gate">VIP Mandap Gate</option>
              </select>

              {/* Manual Walk-in Add Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsWalkInOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#780616] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#8B081A] transition-all"
              >
                <span>+ Manual Walk-in</span>
              </button>
            </div>
          </div>

          {/* 4 LIVE TELEMETRY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1">
            {/* Metric 1: Expected */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827566]">Total Expected</span>
                <div className="w-8 h-8 rounded-lg bg-[#FAF2EE] text-[#7F560C] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B19]">
                    {telemetry?.totalExpected || 350}
                  </span>
                  <span className="text-xs text-[#827566]">Royal Invites</span>
                </div>
                <div className="w-full bg-[#FAF2EE] rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-[#BF8E42] h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${telemetry?.attendancePace || 55}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#827566] mt-2 flex justify-between">
                  <span>Overall Pace</span>
                  <span className="font-bold text-[#1E1B19]">{telemetry?.attendancePace || 55}% Registered</span>
                </p>
              </div>
            </div>

            {/* Metric 2: Arrived */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827566]">Welcomed & Inside</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  +1 Just Now
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B19]">
                    {telemetry?.totalWelcomed || 192}
                  </span>
                  <span className="text-xs font-semibold text-[#7F560C]">Headcount in Mandap</span>
                </div>
                <p className="text-[11px] text-[#827566] mt-3 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[#7F560C]" />
                  <span>
                    Avg. gate turnaround: <strong className="text-[#1E1B19]">6.4s per family</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Metric 3: Royal Dignitaries */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827566]">VIP Dignitaries</span>
                <div className="w-8 h-8 rounded-lg bg-[#FAF2EE] text-[#BF8E42] flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#BF8E42]">
                    {telemetry?.totalVipArrived || 28}{' '}
                    <span className="text-base font-normal text-[#827566]">/ {telemetry?.totalVipExpected || 32}</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">87.5%</span>
                </div>
                <p className="text-[11px] text-[#780616] font-medium mt-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>4 Royal Suites pending transit</span>
                </p>
              </div>
            </div>

            {/* Metric 4: Dietary Flags */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827566]">Gate Dietary Flags</span>
                <button
                  type="button"
                  onClick={() => showToast('Kitchen Notified', 'Banquet chef dispatched fresh batches to Zone A', true)}
                  className="px-2 py-0.5 rounded-lg bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#780616] text-[11px] font-bold transition-colors"
                >
                  Notify Kitchen
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] text-xs font-bold text-[#1E1B19]">
                    {telemetry?.dietaryCounts?.jain || 42} Jain
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] text-xs font-bold text-[#1E1B19]">
                    {telemetry?.dietaryCounts?.vegan || 14} Vegan
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] text-xs font-bold text-[#1E1B19]">
                    {telemetry?.dietaryCounts?.halal || 6} Halal
                  </span>
                </div>
                <p className="text-[11px] text-[#827566] mt-3 flex items-center gap-1 truncate">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#BF8E42]" />
                  <span>Royal Maharajas Pavilions notified</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DUAL-PANE VERIFICATION COMMAND CENTER (55% / 45% Split)                 */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Optical QR Sensor & Manual Fallback (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-6 rounded-3xl bg-white border border-[#E9E1DD] shadow-md flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#7F560C]" />
                  <h2 className="font-serif text-lg font-bold text-[#1E1B19]">Optical Pass Sensor</h2>
                </div>
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF2EE] text-[#7F560C] font-bold border border-[#E9E1DD]">
                  HD Lens 1 Active
                </span>
              </div>

              {/* Stylized Camera Viewport & Laser Scanner HUD */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#1E1B19] shadow-inner flex items-center justify-center group">
                {/* Background Atmosphere */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0"></div>

                {/* Palace Courtyard Atmosphere Backdrop */}
                <div className="absolute inset-0 bg-[#291800]/40 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-2xl"></div>
                </div>

                {/* Golden Corner Target Reticles */}
                <div className="absolute inset-6 pointer-events-none z-10 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-sm"></div>
                    <div className="w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-sm"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-sm"></div>
                    <div className="w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] rounded-br-sm"></div>
                  </div>
                </div>

                {/* Active Laser Scanner Beam */}
                <div
                  className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-[#F4BD6C] to-transparent z-20 shadow-[0_0_15px_#F4BD6C] transition-all duration-1000 ease-in-out"
                  style={{ top: `${laserPos}%` }}
                ></div>

                {/* Target Wedding Pass Graphic Inside Reticle */}
                <div className="relative z-10 p-4 rounded-xl bg-white/90 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2 max-w-[210px] text-center border border-[#D4AF37]/50">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <QrCode className="w-20 h-20 text-[#1E1B19]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#7F560C] tracking-widest">
                    {dossier?.passToken || 'MM-VIV-9821'}
                  </span>
                  <span className="text-[10px] text-[#827566] uppercase tracking-wider font-semibold">
                    Align inside frame
                  </span>
                </div>

                {/* Scanner Status Tag */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-20">
                  <span className="text-[11px] text-white/80 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Searching QR Matrix...
                  </span>
                  <span className="text-[11px] text-white/60 font-mono">FPS: 60.0</span>
                </div>
              </div>

              {/* Scanner Hardware Toolbar */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Lens Flipped', 'Switched to front-facing usher lens', true)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#827566] hover:text-[#1E1B19] gap-1 transition-colors border border-[#E9E1DD]"
                >
                  <Camera className="w-4 h-4 text-[#7F560C]" />
                  <span className="text-[10px] font-bold">Flip Lens</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTorchEnabled((prev) => !prev)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-bold gap-1 transition-colors ${
                    torchEnabled
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-[#FAF2EE] border-[#E9E1DD] text-[#827566] hover:text-[#1E1B19]'
                  }`}
                >
                  <Flashlight className="w-4 h-4 text-[#BF8E42]" />
                  <span>Torch [{torchEnabled ? 'ON' : 'OFF'}]</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Auto-Lock On', 'Focus locked on high-density QR targets', true)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#827566] hover:text-[#1E1B19] gap-1 transition-colors border border-[#E9E1DD]"
                >
                  <Check className="w-4 h-4 text-[#7F560C]" />
                  <span className="text-[10px] font-bold">Auto-Lock</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('ISO Calibrated', 'Sensor exposure adjusted for palace lighting', true)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#827566] hover:text-[#1E1B19] gap-1 transition-colors border border-[#E9E1DD]"
                >
                  <RefreshCw className="w-4 h-4 text-[#7F560C]" />
                  <span className="text-[10px] font-bold">Calibrate</span>
                </button>
              </div>

              {/* Manual Fallback Search Field */}
              <div className="pt-2 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#827566]">
                  Manual Code / Mobile Search Fallback
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify(manualCode)}
                      placeholder="Pass Token (e.g. 9821) or 10-digit Phone..."
                      className="w-full bg-[#FAF2EE] px-3.5 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-[#827566]/60 border border-[#E9E1DD] focus:outline-none focus:border-[#BF8E42]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerify(manualCode)}
                    disabled={isScanning || !manualCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#BF8E42] text-white text-xs font-bold hover:bg-[#A67832] transition-all shadow-sm flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </button>
                </div>
              </div>

              {/* Quick Test Diagnostics */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9E1DD] flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#827566]">
                  Gate Attendant Diagnostics & Tools
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateVip}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF2EE] text-[#7F560C] text-xs font-bold border border-[#E9E1DD] transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>⚡ Simulate Valid VIP Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateDuplicate}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF2EE] text-[#780616] text-xs font-bold border border-[#E9E1DD] transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>⚠️ Duplicate Warning Test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStandeeOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF2EE] text-[#1E1B19] text-xs font-bold border border-[#E9E1DD] transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>🖨️ Print Token Standee</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Instant Guest Verification Dossier & Gate Clearance (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E9E1DD] shadow-md flex flex-col gap-6 relative overflow-hidden">
              {/* Verification Status Banner */}
              <div
                className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                  dossier?.status === 'ACCESS_GRANTED'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : dossier?.status === 'ALREADY_CHECKED_IN'
                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {dossier?.status === 'ACCESS_GRANTED' ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : dossier?.status === 'ALREADY_CHECKED_IN' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  ) : (
                    <X className="w-6 h-6 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wider block">
                      {dossier?.status === 'ACCESS_GRANTED'
                        ? 'ACCESS GRANTED • VERIFIED ROYAL PASS'
                        : dossier?.status === 'ALREADY_CHECKED_IN'
                        ? 'ALREADY CHECKED IN • DUPLICATE WARNING'
                        : 'INVALID OR UNRECOGNIZED PASS'}
                    </span>
                    <span className="text-[11px] text-[#827566]">
                      {dossier?.status === 'ACCESS_GRANTED'
                        ? 'Digital Token authenticated against Mewar Guest Registry'
                        : dossier?.status === 'ALREADY_CHECKED_IN'
                        ? `Scanned previously at ${dossier.previousCheckIn?.checkedInAt} via ${dossier.previousCheckIn?.gateName}`
                        : 'Please check pass token spelling or register walk-in'}
                    </span>
                  </div>
                </div>
                <span className="font-serif text-sm font-bold tracking-tight px-3 py-1 rounded-xl bg-white shadow-sm border border-stone-200">
                  {dossier?.status === 'ACCESS_GRANTED'
                    ? 'GATE CLEAR'
                    : dossier?.status === 'ALREADY_CHECKED_IN'
                    ? 'PREVENTED'
                    : 'REJECTED'}
                </span>
              </div>

              {/* Guest Identity Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar Monogram with Luxury Foil Look */}
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#7F560C] via-[#BF8E42] to-[#F4BD6C] flex items-center justify-center text-white font-serif text-xl font-bold shadow-md shrink-0 border border-white">
                    <span>{dossier?.initials || 'VR'}</span>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow border border-[#E9E1DD]">
                      <Crown className="w-3.5 h-3.5 text-[#BF8E42]" />
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B19]">
                      {dossier?.name || 'Dr. Vikramaditya Rathore & Family'}
                    </h3>
                    <p className="text-xs text-[#827566] mt-0.5">
                      {dossier?.title || 'Senior Surgeon, Mewar Medical Council'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF2EE] text-[#7F560C] text-[11px] font-bold border border-[#E9E1DD] flex items-center gap-1">
                        <Crown className="w-3 h-3 text-[#BF8E42]" />
                        <span>{dossier?.category || "VIP Dignitary • Groom's Family Side"}</span>
                      </span>
                      <span className="text-[#827566] text-xs">•</span>
                      <span className="text-xs text-[#827566] font-medium">Udaipur Royal Circle</span>
                    </div>
                  </div>
                </div>

                {/* QR Mini Preview Pill */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center p-3 rounded-xl bg-[#FAF2EE] border border-[#E9E1DD] shrink-0 gap-1 text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#827566] font-bold">Pass Identifier</span>
                  <span className="font-mono text-sm font-bold text-[#1E1B19]">{dossier?.passToken}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">WhatsApp Verified</span>
                </div>
              </div>

              {/* Pass Details 4-Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Box 1: Headcount */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E9E1DD] flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[#827566]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Accompanying Count</span>
                    <Users className="w-4 h-4 text-[#7F560C]" />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold text-[#1E1B19]">
                      {dossier?.headcount} Guests{' '}
                      <span className="text-xs font-normal text-[#827566]">(Primary + {dossier.headcount - 1})</span>
                    </p>
                    <p className="text-xs text-[#827566] mt-0.5 truncate">
                      {dossier?.companions?.join(', ') || 'Mrs. Sunita Rathore, Aryan Rathore'}
                    </p>
                  </div>
                </div>

                {/* Box 2: Assigned Seating */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E9E1DD] flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[#827566]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Pavilion Table</span>
                    <button
                      type="button"
                      onClick={() => showToast('Seating Map', 'Table 4 is located front-left of the Sacred Mandap', true)}
                      className="text-[#7F560C] hover:underline text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <span>View Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#BF8E42]" />
                      <p className="font-serif text-lg font-bold text-[#1E1B19]">{dossier?.assignedTable}</p>
                    </div>
                    <p className="text-xs text-[#827566] mt-0.5">{dossier?.zone || 'Grand Mandap Front View • Zone A'}</p>
                  </div>
                </div>

                {/* Box 3: Dietary Protocol Alert */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FAF2EE] border border-[#E9E1DD] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-[#BF8E42]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1E1B19]">
                        Kitchen Dietary Protocol Flagged
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Chef Action Queued
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#1E1B19]">
                    {dossier?.foodPreference || 'Strict Jain (No Onion / Garlic / Root Vegetables)'}
                  </p>
                  <p className="text-[11px] text-[#827566]">
                    Banquet Captain <strong className="text-[#1E1B19]">Mahesh Panwar</strong> has been notified via
                    Kitchen Display Unit 3.
                  </p>
                </div>
              </div>

              {/* Gate Security & Anti-Passback Audit Badge */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9E1DD] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#7F560C]" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1B19] block">Anti-Passback Protocol Active</span>
                    <span className="text-[11px] text-[#827566]">
                      Pass locks post-entry to prevent duplicate gate entry attempts.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white border border-[#E9E1DD] text-[#7F560C] shadow-sm whitespace-nowrap">
                  Status: {dossier?.status === 'ALREADY_CHECKED_IN' ? 'PREVIOUSLY SCANNED' : 'UNUSED'}
                </span>
              </div>

              {/* Large One-Tap Gate Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Primary Clearance CTA */}
                <button
                  type="button"
                  onClick={handleConfirmEntry}
                  disabled={dossier?.status === 'ALREADY_CHECKED_IN'}
                  className="flex-1 py-4 px-6 rounded-2xl bg-[#780616] text-white font-serif text-sm sm:text-base font-bold uppercase tracking-wider shadow-lg hover:bg-[#8B081A] transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Confirm Entry & Welcome ({dossier?.headcount || 1} Guests)</span>
                </button>

                {/* Secondary Royal Escort Button */}
                <button
                  type="button"
                  onClick={() =>
                    showToast('Royal Escort Assigned', 'Butler Vikram assigned to escort guests to Peacock Pavilion', true)
                  }
                  className="py-4 px-5 rounded-2xl bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#1E1B19] text-xs font-bold uppercase tracking-wider border border-[#E9E1DD] transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Crown className="w-4 h-4 text-[#BF8E42]" />
                  <span>Assign Royal Escort</span>
                </button>

                {/* WhatsApp Dispatch Button */}
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Welcome WhatsApp Dispatched',
                      `Table welcome guide sent to ${dossier?.name || 'guest'}`,
                      true
                    )
                  }
                  className="p-4 rounded-2xl bg-[#FAF2EE] hover:bg-[#F4ECE8] text-[#7F560C] border border-[#E9E1DD] transition-all flex items-center justify-center shrink-0"
                  title="Dispatch Table Welcome via WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: LIVE ENTRANCE FEED & BANQUET OCCUPANCY                 */}
      {/* ========================================================================= */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 8 COLS: Live Gate Check-in Ledger */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="p-6 rounded-3xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1E1B19]">Live Gate Check-in Ledger</h2>
                  <p className="text-xs text-[#827566]">
                    Real-time chronicle of verified gate passages across palace entries
                  </p>
                </div>

                {/* Ledger Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      ledgerFilter === 'all'
                        ? 'bg-[#1E1B19] text-white shadow-sm'
                        : 'bg-[#FAF2EE] text-[#827566] hover:text-[#1E1B19]'
                    }`}
                  >
                    All Arrivals ({ledger.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('vip')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      ledgerFilter === 'vip'
                        ? 'bg-[#BF8E42] text-white shadow-sm'
                        : 'bg-[#FAF2EE] text-[#827566] hover:text-[#1E1B19]'
                    }`}
                  >
                    VIPs Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('dietary')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      ledgerFilter === 'dietary'
                        ? 'bg-[#7F560C] text-white shadow-sm'
                        : 'bg-[#FAF2EE] text-[#827566] hover:text-[#1E1B19]'
                    }`}
                  >
                    Dietary Flags
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerFilter('warning')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      ledgerFilter === 'warning'
                        ? 'bg-[#780616] text-white shadow-sm'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Warnings
                  </button>
                </div>
              </div>

              {/* Chronological List of Recent Arrivals */}
              <div className="flex flex-col gap-2.5">
                {ledger.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.status === 'WARNING'
                        ? 'bg-red-50/60 border-red-200'
                        : 'bg-[#FAF7F2] hover:bg-[#F4ECE8]/60 border-[#E9E1DD]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm font-bold shrink-0 shadow-sm ${
                          item.status === 'WARNING'
                            ? 'bg-red-200 text-red-800'
                            : item.isVip
                            ? 'bg-[#F4BD6C] text-[#291800]'
                            : 'bg-[#FAF2EE] text-[#7F560C] border border-[#E9E1DD]'
                        }`}
                      >
                        {item.initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-serif text-sm font-bold ${
                              item.status === 'WARNING' ? 'text-red-900' : 'text-[#1E1B19]'
                            }`}
                          >
                            {item.guestName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'WARNING'
                                ? 'bg-red-200 text-red-900'
                                : item.isVip
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#FAF2EE] text-[#827566]'
                            }`}
                          >
                            {item.category}
                          </span>
                          {item.hasDietaryFlag && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Dietary Flag
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#827566] mt-0.5">
                          {item.status === 'WARNING' ? (
                            <span className="text-red-700 font-medium">{item.warningNote}</span>
                          ) : (
                            <>
                              Count: <strong className="text-[#1E1B19]">{item.headcount} Guests</strong> •{' '}
                              {item.assignedTable} • {item.gateName} Usher: {item.usherName}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                      <span
                        className={`text-xs font-bold ${
                          item.status === 'WARNING' ? 'text-red-700' : 'text-[#7F560C]'
                        }`}
                      >
                        {item.checkedInAt}
                      </span>
                      <span className="text-[10px] text-[#827566]">{item.gateName}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination & Export */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#827566] border-t border-[#E9E1DD] mt-2">
                <span>Showing recent {ledger.length} check-in ledger entries</span>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="text-[#780616] hover:underline font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Full CSV Audit</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: Banquet Zone Gauge & Distribution */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="p-6 rounded-3xl bg-white border border-[#E9E1DD] shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-[#1E1B19]">Banquet Zone Gauge</h2>
                <UtensilsCrossed className="w-5 h-5 text-[#BF8E42]" />
              </div>

              {/* Circular SVG Ring Gauge */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-[#FAF2EE]"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                    ></circle>
                    <circle
                      className="text-[#BF8E42] transition-all duration-1000 ease-out"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="40"
                      stroke="currentColor"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * (telemetry?.attendancePace || 55)) / 100}
                      strokeLinecap="round"
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-serif text-3xl font-bold text-[#1E1B19] leading-none">
                      {telemetry?.attendancePace || 55}%
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[#827566] mt-1 font-bold">
                      {telemetry?.totalWelcomed || 192} / {telemetry?.totalExpected || 350} Cap
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#827566] mt-2 text-center">
                  Target lawn comfort capacity threshold: <strong>380 Max</strong>
                </p>
              </div>

              {/* Zone Breakdown Progress Bars */}
              <div className="flex flex-col gap-4">
                {(telemetry?.zones || [
                  { name: 'Mandap Lawn Seating', capacity: 120, seated: 84, percentage: 70 },
                  { name: 'Peacock Dining Pavilion', capacity: 130, seated: 68, percentage: 52 },
                  { name: 'Family High-Tea Lounge', capacity: 100, seated: 40, percentage: 40 },
                ]).map((zone, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#1E1B19] font-bold">{zone.name}</span>
                      <span className="text-[#827566]">
                        {zone.seated} / {zone.capacity} ({zone.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF2EE] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          idx === 0 ? 'bg-[#780616]' : idx === 1 ? 'bg-[#BF8E42]' : 'bg-[#D4AF37]'
                        }`}
                        style={{ width: `${zone.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instant Banquet Master Callout */}
              <div className="p-4 rounded-2xl bg-[#FAF2EE] border border-[#E9E1DD] flex items-start gap-3">
                <UtensilsCrossed className="w-5 h-5 text-[#BF8E42] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#1E1B19]">Kitchen Master Alert Active</p>
                  <p className="text-xs text-[#827566] mt-0.5">
                    42 Jain thalis queued for Tables 4, 8 & 12. Fresh batches dispatched via Courtyard Butler station.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODALS: MANUAL WALK-IN & PRINTABLE STANDEE                              */}
      {/* ========================================================================= */}
      {/* A. Manual Walk-In Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E9E1DD] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E1DD]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#BF8E42]" />
                <h3 className="font-serif text-lg font-bold text-[#1E1B19]">Manual Walk-In Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWalkInOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-[#827566] uppercase tracking-wider mb-1">
                  Full Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Maharaja Samarjit Singh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E1DD] text-xs font-semibold focus:outline-none focus:border-[#BF8E42]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#827566] uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E1DD] text-xs focus:outline-none focus:border-[#BF8E42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#827566] uppercase tracking-wider mb-1">
                    Headcount
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={walkInCount}
                    onChange={(e) => setWalkInCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E1DD] text-xs font-bold focus:outline-none focus:border-[#BF8E42]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#827566] uppercase tracking-wider mb-1">
                    Seating Table
                  </label>
                  <select
                    value={walkInTable}
                    onChange={(e) => setWalkInTable(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E9E1DD] text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="Table 1 — Peacock Pavilion">Table 1 — Peacock</option>
                    <option value="Table 2 — Royal Courtyard">Table 2 — Courtyard</option>
                    <option value="Table 4 — Peacock Pavilion">Table 4 — Peacock</option>
                    <option value="Table 8 — Lawn Terrace">Table 8 — Lawn</option>
                    <option value="Table 14 — Lounge">Table 14 — Lounge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#827566] uppercase tracking-wider mb-1">
                    Dietary
                  </label>
                  <select
                    value={walkInFood}
                    onChange={(e) => setWalkInFood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E9E1DD] text-xs font-semibold bg-white focus:outline-none"
                  >
                    <option value="Traditional Royal Rajasthani Vegetarian">Vegetarian</option>
                    <option value="Strict Jain (No Onion / Garlic)">Strict Jain</option>
                    <option value="Vegan Specialty">Vegan</option>
                    <option value="Halal Certified">Halal</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#780616] text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-[#8B081A] transition-all"
              >
                Clear Gate & Record Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B. Printable Standee Modal */}
      {isStandeeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E9E1DD] flex flex-col items-center text-center gap-4">
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => setIsStandeeOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-full bg-[#FAF2EE] text-[#7F560C] flex items-center justify-center border border-[#E9E1DD]">
              <Crown className="w-8 h-8 text-[#BF8E42]" />
            </div>

            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#BF8E42] font-bold">
                Royal Gate Standee
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B19] mt-0.5">{coupleTitle}</h3>
              <p className="text-xs text-[#827566]">Sacred Muhurtham Entrance</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border-2 border-dashed border-[#BF8E42]/60 shadow-inner">
              <QrCode className="w-40 h-40 text-[#1E1B19]" />
            </div>

            <p className="text-xs text-[#827566] max-w-xs">
              Present this pass at Gate 1 or Gate 2 for instant VIP priority clearance.
            </p>

            <button
              type="button"
              onClick={() => {
                window.print();
                setIsStandeeOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-[#780616] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#8B081A]"
            >
              Print Gate Token Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
