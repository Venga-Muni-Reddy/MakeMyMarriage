import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Menu,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentWedding } = useWedding();
  const { weddingId } = useParams<{ weddingId: string }>();
  const location = useLocation();
  const base = weddingId ? `/dashboard/${weddingId}` : '/dashboard';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const weddingSlug = currentWedding?.slug || 'ananya-rahul';
  const coupleTitle = currentWedding?.settings?.partner1Name && currentWedding?.settings?.partner2Name
    ? `${currentWedding.settings.partner1Name} & ${currentWedding.settings.partner2Name}`
    : currentWedding?.name || 'Ananya & Rahul';

  const venueInfo = currentWedding?.settings?.primaryVenueName
    ? `${currentWedding.settings.primaryVenueName} • ${currentWedding.settings.displayDate || 'Auspicious Muhurtham'}`
    : 'City Palace, Udaipur • Dec 18–20';

  const navItems = [
    { label: 'Overview', path: `${base}`, icon: Heart, exact: true },
    { label: 'Ceremonies', path: `${base}/events`, icon: Calendar },
    { label: 'Guests & RSVPs', path: `${base}/guests`, icon: Users },
    { label: 'Digital Invites', path: `${base}/invitations`, icon: Mail, badge: 'Ready' },
    { label: 'Checklist & Tasks', path: `${base}/tasks`, icon: CheckSquare },
    { label: 'Photo Vault', path: `${base}/gallery`, icon: Camera, badge: '248' },
    { label: 'VIP QR Check-in', path: `${base}/checkin`, icon: QrCode },
    { label: 'Public Website', path: `/w/${weddingSlug}`, icon: Globe, external: false },
    { label: 'Settings & Roles', path: `${base}/settings`, icon: Settings },
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
            <Link to="/" className="flex items-center space-x-2.5">
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

          {/* Active Ceremony Context Card */}
          <div className="m-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                Ceremony Context
              </span>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-serif text-base font-bold text-on-surface">{coupleTitle}</h3>
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-on-surface-variant">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{venueInfo}</span>
            </div>
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
        <Link to="/" className="flex items-center space-x-2">
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
          <div className="w-72 bg-surface-container-lowest h-full p-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <span className="font-serif text-lg font-bold text-primary">Imperial Concierge</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                <span className="text-[11px] text-secondary font-medium">Auspicious Day</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-on-surface">
                Namaste Radhika, Maharani Suite
              </h2>
            </div>

            {/* Quick Muhurtham Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed shadow-xs text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Muhurtham: 14h : 22m : 40s</span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            {/* Share Public Website Pill */}
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
              <span>{copied ? 'Copied Link!' : '/w/ananya-rahul'}</span>
            </button>

            {/* Live Website Preview */}
            <Link
              to="/w/ananya-rahul"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Preview Live</span>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
              <Bell className="w-4 h-4 text-on-surface-variant" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-white" />
            </button>

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

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
