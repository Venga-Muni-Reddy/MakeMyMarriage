import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Users,
  Mail,
  CheckSquare,
  Camera,
  QrCode,
  Globe,
  Settings,
  Clock,
  Bell,
  Plus,
  ExternalLink,
  LogOut,
  MapPin,
  Menu,
  X,
  Copy,
  Check,
  ChevronDown,
  Crown,
  ShieldCheck,
  UtensilsCrossed,
  Tv,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { weddingService } from '../../services/wedding.service';
import { notificationService, NotificationItem } from '../../services/notification.service';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentWedding, weddings, selectWedding, refreshWeddings } = useWedding();
  const { weddingId } = useParams<{ weddingId: string }>();
  const location = useLocation();
  const base = weddingId ? `/dashboard/${weddingId}` : '/dashboard';

  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Top-bar Notification Center State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [inboxNotifications, setInboxNotifications] = useState<NotificationItem[]>([]);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsSwitcherOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  // Click outside to close switcher or notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!currentWedding?.id) return;
    try {
      const data = await notificationService.getNotifications(currentWedding.id);
      setInboxNotifications(data.slice(0, 6));
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentWedding?.id]);

  // Synchronize route :weddingId with active wedding context
  useEffect(() => {
    if (weddingId && currentWedding?.id !== weddingId && weddings.length > 0) {
      selectWedding(weddingId);
    }
  }, [weddingId, currentWedding, weddings, selectWedding]);

  const handleSwitchWedding = (targetWeddingId: string) => {
    selectWedding(targetWeddingId);
    setIsSwitcherOpen(false);
    navigate(`/dashboard/${targetWeddingId}`);
  };

  const hasWedding = Boolean(currentWedding);
  const weddingSlug = currentWedding?.slug || '';
  const coupleTitle = currentWedding?.settings?.partner1Name && currentWedding?.settings?.partner2Name
    ? `${currentWedding.settings.partner1Name} & ${currentWedding.settings.partner2Name}`
    : currentWedding?.name?.replace(/^The Royal Union of /i, '') || (hasWedding ? 'Royal Union' : 'No Active Wedding');

  const venueInfo = currentWedding?.settings?.primaryVenueName
    ? `${currentWedding.settings.primaryVenueName} • ${currentWedding.settings.displayDate || 'Auspicious Muhurtham'}`
    : (hasWedding ? 'Auspicious Venue' : 'Setup your royal wedding');

  const currentRole = hasWedding
    ? (currentWedding?.members?.[0]?.role?.name ||
       currentWedding?.userRole ||
       (currentWedding?.ownerId === user?.id ? 'OWNER' : 'ORGANIZER'))
    : 'NEW HOST';

  const currentMembership = currentWedding?.members?.find(
    (m: any) => m.userId === user?.id
  ) || currentWedding?.members?.[0];

  const isPendingInvite = currentMembership?.status === 'INVITED';

  const handleAcceptInvitation = async () => {
    if (!currentWedding?.id) return;
    setIsAccepting(true);
    try {
      await weddingService.acceptInvitation(currentWedding.id);
      await refreshWeddings();
      setAcceptSuccess(true);
      setTimeout(() => setAcceptSuccess(false), 6000);
    } catch (err: any) {
      console.error('Failed to accept council invitation', err);
    } finally {
      setIsAccepting(false);
    }
  };

  const navItems = [
    { label: 'Overview', path: `${base}`, icon: Heart, exact: true },
    { label: 'Ceremonies', path: `${base}/events`, icon: Calendar },
    { label: 'Guests', path: `${base}/guests`, icon: Users },
    { label: 'RSVP Telemetry', path: `${base}/rsvps`, icon: UtensilsCrossed, badge: 'Live' },
    { label: 'Digital Invites', path: `${base}/invitations`, icon: Mail, badge: 'Ready' },
    { label: 'Checklist & Tasks', path: `${base}/tasks`, icon: CheckSquare },
    { label: 'Council & Team', path: `${base}/team`, icon: ShieldCheck, badge: 'RBAC' },
    { label: 'Dispatches & Alerts', path: `${base}/notifications`, icon: Bell, badge: 'Hub' },
    { label: 'Photo Vault', path: `${base}/gallery`, icon: Camera, badge: 'Vault' },
    { label: 'VIP QR Check-in', path: `${base}/checkin`, icon: QrCode },
    { label: 'Live Broadcast', path: `${base}/live`, icon: Tv, badge: '4K Live' },
    { label: 'Public Website', path: weddingSlug ? `/w/${weddingSlug}` : '/setup-wedding', icon: Globe, external: false, badge: !weddingSlug ? 'Setup' : undefined },
    { label: 'Settings & Workspace', path: `${base}/settings`, icon: Settings },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + `/w/${weddingSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col lg:flex-row selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* 1. LEFT LUXURY SIDEBAR (DESKTOP) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-72 bg-surface-container-low border-r border-outline-variant/40 flex-col justify-between fixed inset-y-0 left-0 z-40 shadow-sm">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 flex items-center space-x-3 border-b border-outline-variant/30">
            <Link to={base} className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm border border-primary-container/30">
                <Heart className="w-4 h-4 fill-primary text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-on-surface leading-none">
                  MakeMy<span className="text-primary italic">Marriage</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">
                  Royal Concierge
                </span>
              </div>
            </Link>
          </div>

          {/* Active Ceremony Context Card with Royal Wedding Switcher */}
          <div ref={switcherRef} className="relative m-4">
            <div
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
            >
              {/* Top Row: Context Label + Switch Badge */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                  Active Workspace
                </span>
                {weddings.length > 1 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
                    <span>Switch ({weddings.length})</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isSwitcherOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              {/* Couple Name */}
              <h3 className="font-serif text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                {coupleTitle}
              </h3>

              {/* Bottom Row: Venue + Role Badge */}
              <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1 text-on-surface-variant truncate max-w-[125px]">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{venueInfo.split('•')[0].trim()}</span>
                </div>
                <span className="inline-flex items-center gap-1 font-bold text-primary shrink-0">
                  {currentRole === 'OWNER' ? (
                    <Crown className="w-3 h-3 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-primary" />
                  )}
                  <span>{currentRole}</span>
                </span>
              </div>
            </div>

            {/* Dropdown Menu for Switching Between Weddings */}
            {isSwitcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                <div className="p-2.5 border-b border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Assigned Workspaces
                  </span>
                  <span className="text-[10px] text-primary font-semibold">
                    {weddings.length} Active
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-outline-variant/15 p-1">
                  {weddings.map((w) => {
                    const isSelected = w.id === currentWedding?.id;
                    const memberRole =
                      w.members?.[0]?.role?.name ||
                      w.userRole ||
                      (w.ownerId === user?.id ? 'OWNER' : 'ORGANIZER');
                    const wTitle =
                      w.settings?.partner1Name && w.settings?.partner2Name
                        ? `${w.settings.partner1Name} & ${w.settings.partner2Name}`
                        : w.name?.replace(/^The Royal Union of /i, '') || w.name;

                    return (
                      <div
                        key={w.id}
                        onClick={() => handleSwitchWedding(w.id)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-fixed/30 border border-primary/20'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="font-serif font-bold text-xs text-on-surface block truncate">
                              {wTitle}
                            </span>
                            <span className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              {memberRole === 'OWNER' ? (
                                <Crown className="w-2.5 h-2.5 text-amber-600" />
                              ) : (
                                <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                              )}
                              <span>{memberRole}</span>
                              <span>•</span>
                              <span>/w/{w.slug}</span>
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-outline-variant/20 bg-surface-container-low/30">
                  <Link
                    to="/setup-wedding"
                    onClick={() => setIsSwitcherOpen(false)}
                    className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inaugurate New Wedding</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 space-y-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-secondary text-white shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Concierge Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface leading-tight">
                  {user?.name || 'Workspace Host'}
                </span>
                <span className="text-[10px] text-primary font-semibold">
                  {currentWedding?.userRole || 'Wedding Host'}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-on-surface-variant hover:text-secondary transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOP MOBILE HEADER */}
      {/* ========================================================================= */}
      <header className="lg:hidden w-full bg-surface-container-lowest border-b border-outline-variant/40 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to={base} className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <Heart className="w-4 h-4 fill-primary" />
          </div>
          <span className="font-serif text-lg font-bold">
            MakeMy<span className="text-primary italic">Marriage</span>
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-surface-container text-on-surface"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-surface-container-lowest h-full p-4 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <span className="font-serif text-lg font-bold text-primary">Imperial Concierge</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Workspace Switcher */}
              {weddings.length > 1 && (
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-secondary">
                    <span>Workspaces</span>
                    <span className="text-primary">{weddings.length} Active</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {weddings.map((w) => {
                      const isSelected = w.id === currentWedding?.id;
                      const wTitle =
                        w.settings?.partner1Name && w.settings?.partner2Name
                          ? `${w.settings.partner1Name} & ${w.settings.partner2Name}`
                          : w.name?.replace(/^The Royal Union of /i, '') || w.name;
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            handleSwitchWedding(w.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary text-white font-bold'
                              : 'text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="truncate">{wTitle}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-secondary text-white' : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="pt-3 mt-3 border-t border-outline-variant/30 space-y-2">
              <div className="px-1 text-[11px] text-on-surface-variant truncate">{user?.name || 'Signed in'}</div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-secondary hover:bg-surface-container-high"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Desktop Sticky Command Top Bar */}
        <header className="hidden lg:flex h-20 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40 px-8 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary">
                  Shubh Vivah Conclave
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span className="text-[11px] text-secondary font-medium">
                  {hasWedding ? 'Active Wedding' : 'New Host'}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-on-surface">
                Namaste {user?.name || 'Wedding Host'}, Maharani Suite
              </h2>
            </div>

            {/* Quick Muhurtham Pill */}
            {hasWedding && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed shadow-xs text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Muhurtham: {currentWedding?.settings?.displayDate || 'Upcoming'}</span>
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Share Public Website Pill */}
            {hasWedding && weddingSlug ? (
              <>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all"
                  title="Copy Public Wedding Website Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                  <span>{copied ? 'Copied Link!' : `/w/${weddingSlug}`}</span>
                </button>

                <Link
                  to={`/w/${weddingSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <span>Preview Live</span>
                </Link>
              </>
            ) : (
              <Link
                to="/setup-wedding"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inaugurate Wedding</span>
              </Link>
            )}

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                title="Royal Dispatches & Alerts"
              >
                <Bell className="w-4 h-4 text-on-surface-variant" />
                {inboxNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/30 py-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 pb-2 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#1E1B19]">
                        Royal Dispatches & Alerts
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF2EE] text-[#780616]">
                        {inboxNotifications.length}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (currentWedding?.id) {
                          await notificationService.markAllAsRead(currentWedding.id);
                          loadNotifications();
                        }
                      }}
                      className="text-[11px] text-[#B32446] hover:underline font-semibold"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {inboxNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        No pending alerts at this auspicious hour
                      </div>
                    ) : (
                      inboxNotifications.map((notif) => (
                        <div key={notif.id} className="p-3 hover:bg-[#FAF2EE]/40 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <span className="text-base shrink-0">
                              {notif.channel === 'WHATSAPP' ? '💬' : '💌'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#1E1B19] truncate">
                                {notif.subject || 'Royal Announcement'}
                              </p>
                              <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                                {notif.payload?.message || 'Transmission delivered'}
                              </p>
                              <span className="text-[10px] text-stone-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 px-3 border-t border-stone-100 text-center">
                    <Link
                      to={`${base}/notifications`}
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-[#7F560C] font-bold hover:underline block py-1"
                    >
                      Open Full Dispatch Hub →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Add Event Button */}
            <Link
              to={`${base}/events`}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#881337] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ceremony</span>
            </Link>
          </div>
        </header>

        {/* Council Appointment Pending Acceptance Banner */}
        {isPendingInvite && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF2EE] via-white to-[#FFF9E6] border-2 border-[#D4AF37]/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#780616] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#780616]">
                    ✦ Council Appointment Pending
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF9E6] text-[#B87A00] border border-[#B87A00]/30 uppercase">
                    {currentMembership?.role?.name?.replace('_', ' ') || currentRole}
                  </span>
                </div>
                <p className="text-sm font-serif font-bold text-[#1E1B19] mt-0.5">
                  You are invited to join the planning council for {coupleTitle}.
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Accept this appointment to activate your planning authority, ceremony timelines, and task checklists.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="px-5 py-2.5 rounded-xl bg-[#780616] hover:bg-[#8F1633] text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isAccepting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                )}
                <span>{isAccepting ? 'Accepting...' : 'Accept Appointment ✦'}</span>
              </button>
            </div>
          </div>
        )}

        {acceptSuccess && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✦ Council Appointment Accepted! You are now an active collaborator for this wedding.</span>
          </div>
        )}

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
