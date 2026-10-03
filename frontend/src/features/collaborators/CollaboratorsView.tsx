import React, { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../context/WeddingContext';
import {
  collaboratorService,
  CollaboratorMember,
  CollaboratorTelemetry,
  InviteCollaboratorPayload,
} from '../../services/collaborator.service';
import { eventService } from '../../services/event.service';
import {
  ShieldCheck,
  Crown,
  Sparkles,
  Users,
  UserPlus,
  Key,
  Download,
  Search,
  Minus,
  X,
  Hourglass,
  Trash2,
  RefreshCw,
  MoreVertical,
  Gem,
  Eye,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';

export const CollaboratorsView: React.FC = () => {
  const { currentWedding } = useWedding();
  const weddingId = currentWedding?.id;

  const [members, setMembers] = useState<CollaboratorMember[]>([]);
  const [telemetry, setTelemetry] = useState<CollaboratorTelemetry | null>(null);
  const [ceremonies, setCeremonies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HOSTS' | 'PLANNERS' | 'HOSPITALITY' | 'PENDING'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer / Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InviteCollaboratorPayload>({
    email: '',
    name: '',
    phone: '',
    roleName: 'PLANNER',
    relation: '',
    ceremonyScope: 'All Ceremonies',
    personalNote:
      'You are cordially invited to join the inner planning council for our wedding celebrations. Your stewardship ensures perfection in all events.',
  });

  // Action Menu Dropdown State
  const [activeMenuMemberId, setActiveMenuMemberId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const [membersData, telemetryData, eventsData] = await Promise.all([
        collaboratorService.getMembers(weddingId),
        collaboratorService.getTelemetry(weddingId),
        eventService.getEvents(weddingId).catch(() => []),
      ]);
      setMembers(membersData);
      setTelemetry(telemetryData);
      if (eventsData && eventsData.length > 0) {
        setCeremonies(eventsData.map((ev) => ev.name));
      }
    } catch (err: any) {
      console.error('Failed to load collaborator council', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [weddingId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId) return;
    if (!formData.email.trim()) {
      showToast('Please provide an official steward email');
      return;
    }

    setIsSubmitting(true);
    try {
      await collaboratorService.inviteCollaborator(weddingId, {
        email: formData.email.trim(),
        name: formData.name?.trim(),
        phone: formData.phone?.trim(),
        roleName: formData.roleName,
        relation: formData.relation?.trim(),
        ceremonyScope: formData.ceremonyScope,
        personalNote: formData.personalNote,
      });

      showToast(`✦ Council invitation dispatched to ${formData.email}`);
      setIsDrawerOpen(false);
      setFormData({
        email: '',
        name: '',
        phone: '',
        roleName: 'PLANNER',
        relation: '',
        ceremonyScope: 'All Ceremonies',
        personalNote:
          'You are cordially invited to join the inner planning council for our wedding celebrations. Your stewardship ensures perfection in all events.',
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to dispatch royal invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!weddingId) return;
    try {
      await collaboratorService.updateCollaborator(weddingId, memberId, { roleName: newRole });
      showToast(`✦ Role updated to ${newRole}`);
      setActiveMenuMemberId(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update collaborator role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!weddingId) return;
    if (!window.confirm(`Revoke royal privileges for ${memberName}?`)) return;

    try {
      await collaboratorService.removeCollaborator(weddingId, memberId);
      showToast(`✦ Privileges revoked for ${memberName}`);
      setActiveMenuMemberId(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke collaborator');
    }
  };

  const handleResendInvite = async (memberId: string, email: string) => {
    if (!weddingId) return;
    try {
      await collaboratorService.resendInvite(weddingId, memberId);
      showToast(`✦ Royal passkey invite redispatched to ${email}`);
      setActiveMenuMemberId(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend invite');
    }
  };

  const handleExportRoster = () => {
    if (members.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Status', 'Relation', 'Ceremony Scope', 'Invited Date', 'Joined Date'];
    const rows = members.map((m) => [
      `"${m.user.name}"`,
      `"${m.user.email}"`,
      `"${m.role.name}"`,
      `"${m.status}"`,
      `"${m.relation || ''}"`,
      `"${m.ceremonyScope || ''}"`,
      `"${m.invitedAt ? new Date(m.invitedAt).toLocaleDateString() : ''}"`,
      `"${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `royal-council-roster-${weddingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✦ Council Access Roster downloaded');
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.user.name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q) ||
        (m.relation && m.relation.toLowerCase().includes(q)) ||
        m.role.name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'HOSTS') {
        return m.role.name === 'OWNER' || m.role.name === 'CO_HOST';
      }
      if (activeFilter === 'PLANNERS') {
        return m.role.name === 'PLANNER' || m.role.name === 'ORGANIZER';
      }
      if (activeFilter === 'HOSPITALITY') {
        return m.role.name === 'HOSPITALITY' || m.role.name === 'COLLABORATOR';
      }
      if (activeFilter === 'PENDING') {
        return m.status === 'INVITED';
      }
      return true;
    });
  }, [members, searchQuery, activeFilter]);

  const getRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#780616] text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase shadow-sm border border-[#D4AF37]/30">
          <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
          Primary Host
        </span>
      );
    }
    if (r === 'CO_HOST') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FAF2EE] text-[#780616] font-semibold text-xs tracking-wider uppercase border border-[#780616]/20 shadow-xs">
          <Gem className="w-3.5 h-3.5 text-[#C5A059]" />
          Co-Host
        </span>
      );
    }
    if (r === 'PLANNER' || r === 'ORGANIZER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFF9E6] text-[#B87A00] font-semibold text-xs tracking-wider uppercase border border-[#B87A00]/25 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          Lead Planner
        </span>
      );
    }
    if (r === 'HOSPITALITY' || r === 'COLLABORATOR') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EEF5FF] text-[#1D4ED8] font-semibold text-xs tracking-wider uppercase border border-[#1D4ED8]/20 shadow-xs">
          <Key className="w-3.5 h-3.5 text-[#2563EB]" />
          Hospitality Lead
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-stone-100 text-stone-700 font-semibold text-xs tracking-wider uppercase border border-stone-200">
        <Eye className="w-3.5 h-3.5 text-stone-500" />
        Elder Observer
      </span>
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'MM';
  };

  return (
    <div className="relative w-full min-h-screen bg-[#FFFDF9] text-[#1E1B19] pb-24 font-sans selection:bg-[#F4BD6C] selection:text-[#291800]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 px-5 py-3.5 bg-[#1E1B19] text-[#FAF7F2] rounded-xl shadow-2xl border border-[#D4AF37]/40 flex items-center gap-3 animate-fade-in font-medium text-sm">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-8">
        {/* 1. HEADER & CONTEXT BAR */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[#E9E1DD]">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <span>Workspace</span>
              <span className="text-stone-300">/</span>
              <span>Team & RBAC</span>
              <span className="text-stone-300">/</span>
              <span className="text-[#7F560C] font-bold">Council & Collaborators</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E1B19] tracking-tight font-bold">
                Wedding Council & Collaborators
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xs sm:text-sm font-semibold text-[#B32446] tracking-wide">
                ॥ सह वीर्यं करवावहै — Together May We Accomplish Great Deeds ॥
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
              <span className="text-xs text-stone-500 font-medium">
                Role-Based Access Control • {currentWedding?.name || 'Wedding Workspace'}
              </span>
            </div>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportRoster}
              className="px-4 py-2.5 rounded-lg bg-[#EEE7E3] hover:bg-[#E9E1DD] text-[#1E1B19] transition-all text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-[#7A5912]" />
              <span>Export Access Roster</span>
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-[#B32446] hover:bg-[#8F1633] text-white shadow-md transition-all text-xs font-bold flex items-center gap-2.5"
            >
              <UserPlus className="w-4 h-4 text-[#FFD9DC]" />
              <span>+ Inscribe New Collaborator</span>
            </button>
          </div>
        </section>

        {/* 2. COUNCIL TELEMETRY & METRIC CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active Council Members */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Active Council Members
                </span>
                <span className="font-serif text-3xl font-bold text-[#1E1B19] mt-1 leading-none">
                  {telemetry?.activeCount ?? members.filter((m) => m.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#7F560C]">
                <ShieldCheck className="w-5 h-5 text-[#B32446]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#780616] text-[#FAF7F2] text-[10px] ring-2 ring-white font-bold"
                  >
                    {getInitials(m.user.name)}
                  </span>
                ))}
                {members.length > 4 && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-200 text-stone-700 text-[10px] ring-2 ring-white font-semibold">
                    +{members.length - 4}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#7A5912] font-semibold">
                {members.length > 0 ? `${members.length} team member${members.length === 1 ? '' : 's'}` : 'No members yet'}
              </span>
            </div>
          </div>

          {/* Card 2: Pending Invitations */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Awaiting Acceptance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl font-bold text-[#1E1B19] leading-none">
                    {telemetry?.pendingCount ?? members.filter((m) => m.status === 'INVITED').length}
                  </span>
                  <span className="text-[11px] text-[#7A5912] font-bold uppercase">
                    {(telemetry?.pendingCount ?? members.filter((m) => m.status === 'INVITED').length) > 0 ? 'Pending' : 'All Accepted'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FFF9E6] flex items-center justify-center text-[#B87A00]">
                <Hourglass className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-stone-500">
              <span className="text-xs">
                {(telemetry?.pendingCount ?? members.filter((m) => m.status === 'INVITED').length) > 0
                  ? 'Dispatched via Email'
                  : 'No pending invites'}
              </span>
              <span className="text-[11px] text-[#B32446] font-bold">
                {(telemetry?.pendingCount ?? members.filter((m) => m.status === 'INVITED').length) > 0
                  ? 'Resend Ready'
                  : 'Up to Date'}
              </span>
            </div>
          </div>

          {/* Card 3: Role Delegations Breakdown */}
          {(() => {
            const hostCount = members.filter((m) => m.role.name === 'OWNER').length;
            const coHostCount = members.filter((m) => m.role.name === 'CO_HOST').length;
            const plannerCount = members.filter((m) => m.role.name === 'PLANNER' || m.role.name === 'ORGANIZER').length;
            const totalCount = members.length || 1;
            const hostPct = Math.round((hostCount / totalCount) * 100);
            const coHostPct = Math.round((coHostCount / totalCount) * 100);
            const plannerPct = Math.round((plannerCount / totalCount) * 100);
            const otherPct = Math.max(0, 100 - (hostPct + coHostPct + plannerPct));

            return (
              <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Delegation Ratios
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-[#1E1B19]">
                      <span className="font-bold text-[#B32446]">
                        {hostCount} Host{hostCount === 1 ? '' : 's'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#7F560C]">
                        {coHostCount} Co-Host{coHostCount === 1 ? '' : 's'}
                      </span>
                      <span>•</span>
                      <span className="text-stone-600">
                        {plannerCount} Planner{plannerCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#7F560C]">
                    <Layers className="w-5 h-5 text-[#B32446]" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-1.5">
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden flex">
                    <div className="bg-[#B32446] h-full" style={{ width: `${hostPct}%` }}></div>
                    <div className="bg-[#BF8E42] h-full" style={{ width: `${coHostPct}%` }}></div>
                    <div className="bg-[#B89147] h-full" style={{ width: `${plannerPct}%` }}></div>
                    <div className="bg-stone-300 h-full" style={{ width: `${otherPct}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>{new Set(members.map((m) => m.role.name)).size} Role{new Set(members.map((m) => m.role.name)).size === 1 ? '' : 's'}</span>
                    <span>{members.length} Total Passkey{members.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Card 4: Security & Audit Health */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  RBAC Security Health
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-serif text-2xl font-bold text-[#1E1B19]">100% Sovereign</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#7F560C]">
                <Shield className="w-5 h-5 text-[#2E7D32]" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
                Zero permission leaks
              </span>
              <span className="text-[11px] text-[#7F560C] font-bold">RBAC Enforced</span>
            </div>
          </div>
        </section>

        {/* 3. COUNCIL ROSTER & COLLABORATOR MANAGEMENT TABLE */}
        <section className="flex flex-col bg-white rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD] overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF2EE]/50 border-b border-[#E9E1DD]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search guardians by title, family relation, or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C] shadow-xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'ALL'
                    ? 'bg-[#1E1B19] text-[#FAF7F2] shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Council ({members.length})
              </button>
              <button
                onClick={() => setActiveFilter('HOSTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'HOSTS'
                    ? 'bg-[#1E1B19] text-[#FAF7F2] shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Hosts & Co-Hosts ({members.filter((m) => m.role.name === 'OWNER' || m.role.name === 'CO_HOST').length})
              </button>
              <button
                onClick={() => setActiveFilter('PLANNERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'PLANNERS'
                    ? 'bg-[#1E1B19] text-[#FAF7F2] shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Planners ({members.filter((m) => m.role.name === 'PLANNER' || m.role.name === 'ORGANIZER').length})
              </button>
              <button
                onClick={() => setActiveFilter('HOSPITALITY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'HOSPITALITY'
                    ? 'bg-[#1E1B19] text-[#FAF7F2] shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Hospitality ({members.filter((m) => m.role.name === 'HOSPITALITY' || m.role.name === 'COLLABORATOR').length})
              </button>
              <button
                onClick={() => setActiveFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeFilter === 'PENDING'
                    ? 'bg-[#B32446] text-white shadow-xs'
                    : 'bg-stone-100 text-[#B32446] hover:bg-stone-200'
                }`}
              >
                Pending ({members.filter((m) => m.status === 'INVITED').length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF2EE]/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-[#E9E1DD]">
                  <th className="py-3.5 px-6 font-semibold">Guardian / Designation</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
                  <th className="py-3.5 px-4 font-semibold">Ritual / Operational Scope</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Key Bestowed</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-[#1E1B19]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7F560C]" />
                      <span>Gathering royal council stewards...</span>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="font-semibold text-stone-600">No council stewards match the active filter</p>
                      <p className="text-xs mt-1">Click "+ Inscribe New Collaborator" to invite council members.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const isOwner = member.role.name === 'OWNER';
                    const isPending = member.status === 'INVITED';
                    return (
                      <tr key={member.id} className="hover:bg-[#FAF2EE]/30 transition-colors">
                        {/* Guardian / Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-xs shrink-0 ${
                                isOwner
                                  ? 'bg-[#780616] text-[#FAF7F2] ring-2 ring-[#D4AF37]/50'
                                  : isPending
                                  ? 'bg-[#FFF9E6] text-[#B87A00] border border-[#B87A00]/30'
                                  : 'bg-[#FAF2EE] text-[#780616]'
                              }`}
                            >
                              {getInitials(member.user.name)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm text-[#1E1B19] leading-tight flex items-center gap-1.5">
                                {member.user.name}
                                {isOwner && <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />}
                              </span>
                              <span className="text-xs text-stone-500 font-medium">
                                {member.relation || (isOwner ? "Primary Host" : "Council Collaborator")}
                              </span>
                              <span className="text-[11px] text-stone-400 truncate">
                                {member.user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Role */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getRoleBadge(member.role.name)}
                        </td>

                        {/* Scope */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-[#1E1B19]">
                              {member.ceremonyScope || 'All Ceremonies'}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {isOwner
                                ? 'Full Master Administration'
                                : member.role.name === 'CO_HOST'
                                ? 'Ritual Schedules, Guest Coordination & Invites'
                                : member.role.name === 'PLANNER' || member.role.name === 'ORGANIZER'
                                ? 'Vendor Contracts & Ceremony Timelines'
                                : member.role.name === 'HOSPITALITY'
                                ? 'Guest Concierge, Stays & Check-in'
                                : 'Blessings & Ceremony View'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {member.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#2E7D32] font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                              Active Sovereign
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF9E6] text-[#B87A00] text-xs font-semibold border border-[#B87A00]/20">
                              <Hourglass className="w-3 h-3 text-[#D4AF37]" />
                              Invited (Passkey Active)
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-stone-500 text-xs">
                          {member.joinedAt
                            ? new Date(member.joinedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : member.invitedAt
                            ? new Date(member.invitedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Permanent'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => handleResendInvite(member.id, member.user.email)}
                                className="px-2.5 py-1 text-xs font-semibold text-[#B32446] hover:bg-[#FAF2EE] rounded-lg transition-colors border border-[#B32446]/20"
                              >
                                Resend Pass
                              </button>
                            )}

                            {!isOwner && (
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveMenuMemberId(activeMenuMemberId === member.id ? null : member.id)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenuMemberId === member.id && (
                                  <div className="absolute right-0 top-8 z-30 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 text-left animate-in fade-in zoom-in-95">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                      Elevate / Alter Role
                                    </div>
                                    <button
                                      onClick={() => handleRoleChange(member.id, 'CO_HOST')}
                                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-[#FAF2EE] hover:text-[#780616] flex items-center gap-2"
                                    >
                                      <Gem className="w-3.5 h-3.5 text-[#D4AF37]" />
                                      <span>Make Co-Host</span>
                                    </button>
                                    <button
                                      onClick={() => handleRoleChange(member.id, 'PLANNER')}
                                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-[#FAF2EE] hover:text-[#780616] flex items-center gap-2"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-[#B87A00]" />
                                      <span>Make Lead Planner</span>
                                    </button>
                                    <button
                                      onClick={() => handleRoleChange(member.id, 'HOSPITALITY')}
                                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-[#FAF2EE] hover:text-[#780616] flex items-center gap-2"
                                    >
                                      <Key className="w-3.5 h-3.5 text-[#1D4ED8]" />
                                      <span>Make Hospitality Concierge</span>
                                    </button>
                                    <button
                                      onClick={() => handleRoleChange(member.id, 'VIEWER')}
                                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-[#FAF2EE] hover:text-[#780616] flex items-center gap-2"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                                      <span>Make Elder Observer</span>
                                    </button>
                                    <div className="border-t border-stone-100 my-1"></div>
                                    <button
                                      onClick={() => handleRemoveMember(member.id, member.user.name)}
                                      className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Revoke Royal Privileges</span>
                                    </button>
                                  </div>
                                )}
                              </div>
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

          {/* Footer Info */}
          <div className="p-4 px-6 bg-[#FAF2EE]/60 border-t border-[#E9E1DD] flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2">
            <span>Displaying {filteredMembers.length} royal stewards across 5 authority levels</span>
            <span>Cryptographic passkeys enforced via Vivaha Shield</span>
          </div>
        </section>

        {/* 4. INTERACTIVE ROLE PRIVILEGES & RBAC GOVERNANCE MATRIX */}
        <section className="flex flex-col gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_20px_rgba(28,25,23,0.03)] border border-[#E9E1DD]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <span className="text-[11px] font-bold text-[#B32446] uppercase tracking-widest block">
                Governance Architecture
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1E1B19] mt-1">
                Imperial Role Privileges Matrix
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Enforces ritual privacy, confidential guest arrangements, and sacred Muhurat preservation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#B32446]" /> Full Sovereign
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#7F560C]" /> Operational
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-stone-400" /> Read Only
              </span>
              <span className="flex items-center gap-1.5 text-stone-400">
                <Minus className="w-4 h-4" /> Restricted
              </span>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF2EE]/60 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                  <th className="py-3 px-4 font-semibold w-1/3">Privilege Category & Authority</th>
                  <th className="py-3 px-3 text-center font-semibold">Primary Host (Owner)</th>
                  <th className="py-3 px-3 text-center font-semibold">Co-Host</th>
                  <th className="py-3 px-3 text-center font-semibold">Lead Planner</th>
                  <th className="py-3 px-3 text-center font-semibold">Hospitality Lead</th>
                  <th className="py-3 px-3 text-center font-semibold">Elder Observer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {/* Row 1 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Core Vivah Settings</span>
                    <span className="text-[11px] text-stone-400">Modify dates, ritual times, delete suite</span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-[#B32446]">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-[#B32446]">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Sacred Ceremonies & Venues</span>
                    <span className="text-[11px] text-stone-400">Assign pandits, lock mandap timelines</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-[#7F560C]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Eye className="w-4 h-4 mx-auto text-stone-400" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Eye className="w-4 h-4 mx-auto text-stone-400" />
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Guest Registry & Household VIP Concierge</span>
                    <span className="text-[11px] text-stone-400">Dietary preferences, suite allocations, VIP tags</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-[#7F560C]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-[#7F560C]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Eye className="w-4 h-4 mx-auto text-stone-400" />
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Digital Passes & Gate QR Check-in</span>
                    <span className="text-[11px] text-stone-400">Guest arrivals, badge & barcode check-in</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-[#7F560C]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Sparkles className="w-4 h-4 mx-auto text-[#7F560C]" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Financials, Retainers & Contracts</span>
                    <span className="text-[11px] text-stone-400">Vendor advances, retainers & catering escrow</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-[10px] font-bold text-stone-400">
                    Quotes Only
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                </tr>

                {/* Row 6 */}
                <tr className="hover:bg-[#FAF2EE]/20">
                  <td className="py-3.5 px-4">
                    <span className="block font-semibold text-[#1E1B19]">Collaborator Administration</span>
                    <span className="text-[11px] text-stone-400">Inscribe members, revoke passes, elevate roles</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-[#B32446]" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-[10px] font-bold text-stone-400">
                    Invites Only
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3.5 px-3 text-center text-stone-300">
                    <Minus className="w-4 h-4 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 5. SLIDE-OVER DRAWER (Inscribe New Collaborator Modal) */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-[#D4AF37]/30">
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF2EE] flex items-center justify-center text-[#780616] border border-[#780616]/20 shadow-xs">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#B32446] uppercase tracking-wider block">
                      Imperial Council Steward
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#1E1B19]">
                      Inscribe Royal Collaborator
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Grant sacred administrative, ritual coordination, or guest concierge steward privileges to an esteemed member.
              </p>

              {/* Form */}
              <form onSubmit={handleInviteSubmit} className="flex flex-col gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Steward Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1E1B19]">Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.sharma@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1E1B19]">WhatsApp Delivery</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                    />
                  </div>
                </div>

                {/* Relation / Designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">
                    Family Relation or Professional Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sister of the Bride, Wedding Coordinator"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full bg-[#FFFDF9] px-4 py-2.5 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                  />
                </div>

                {/* Role Radio Cards */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#1E1B19]">Select Royal Governance Role</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Co-Host */}
                    <label
                      onClick={() => setFormData({ ...formData, roleName: 'CO_HOST' })}
                      className={`p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all border ${
                        formData.roleName === 'CO_HOST'
                          ? 'bg-[#FAF2EE] border-[#780616] ring-1 ring-[#780616]'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="council-role"
                        checked={formData.roleName === 'CO_HOST'}
                        onChange={() => {}}
                        className="mt-1 accent-[#780616]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#1E1B19]">💍 Co-Host</span>
                        <span className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          Complete management of guests, rituals & budgets.
                        </span>
                      </div>
                    </label>

                    {/* Wedding Planner */}
                    <label
                      onClick={() => setFormData({ ...formData, roleName: 'PLANNER' })}
                      className={`p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all border ${
                        formData.roleName === 'PLANNER'
                          ? 'bg-[#FFF9E6] border-[#B87A00] ring-1 ring-[#B87A00]'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="council-role"
                        checked={formData.roleName === 'PLANNER'}
                        onChange={() => {}}
                        className="mt-1 accent-[#B87A00]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#1E1B19]">📋 Wedding Planner</span>
                        <span className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          Task execution, vendor contracts, ceremony timelines.
                        </span>
                      </div>
                    </label>

                    {/* Hospitality */}
                    <label
                      onClick={() => setFormData({ ...formData, roleName: 'HOSPITALITY' })}
                      className={`p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all border ${
                        formData.roleName === 'HOSPITALITY'
                          ? 'bg-[#EEF5FF] border-[#1D4ED8] ring-1 ring-[#1D4ED8]'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="council-role"
                        checked={formData.roleName === 'HOSPITALITY'}
                        onChange={() => {}}
                        className="mt-1 accent-[#1D4ED8]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#1E1B19]">💌 Hospitality Concierge</span>
                        <span className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          Room keys, guest transfers, luggage and check-in.
                        </span>
                      </div>
                    </label>

                    {/* Elder Observer */}
                    <label
                      onClick={() => setFormData({ ...formData, roleName: 'VIEWER' })}
                      className={`p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all border ${
                        formData.roleName === 'VIEWER'
                          ? 'bg-stone-100 border-stone-400 ring-1 ring-stone-400'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="council-role"
                        checked={formData.roleName === 'VIEWER'}
                        onChange={() => {}}
                        className="mt-1 accent-stone-700"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#1E1B19]">👁️ Elder Observer</span>
                        <span className="text-[11px] text-stone-500 leading-tight mt-0.5">
                          Viewing privileges for schedules and blessings only.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Scope */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#1E1B19]">Ceremony & Ritual Scope</label>
                  <div className="flex items-center gap-4 text-xs text-stone-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ceremony-scope-radio"
                        checked={formData.ceremonyScope === 'All Ceremonies'}
                        onChange={() => setFormData({ ...formData, ceremonyScope: 'All Ceremonies' })}
                        className="accent-[#780616]"
                      />
                      <span>All Ceremonies</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ceremony-scope-radio"
                        checked={formData.ceremonyScope !== 'All Ceremonies'}
                        onChange={() => {
                          const initialScope = ceremonies.length > 0 ? ceremonies[0] : 'Specific Ceremonies';
                          setFormData({ ...formData, ceremonyScope: initialScope });
                        }}
                        className="accent-[#780616]"
                      />
                      <span>Selected Ceremonies Only</span>
                    </label>
                  </div>
                  {formData.ceremonyScope !== 'All Ceremonies' && (
                    <div className="flex flex-col gap-2 mt-1">
                      {ceremonies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {ceremonies.map((c) => {
                            const isSelected = (formData.ceremonyScope || '').includes(c);
                            return (
                              <button
                                type="button"
                                key={c}
                                onClick={() => {
                                  let currentList = (formData.ceremonyScope || '')
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s && s !== 'All Ceremonies' && s !== 'Specific Ceremonies');
                                  if (isSelected) {
                                    currentList = currentList.filter((s) => s !== c);
                                  } else {
                                    currentList.push(c);
                                  }
                                  setFormData({
                                    ...formData,
                                    ceremonyScope: currentList.length > 0 ? currentList.join(', ') : 'All Ceremonies',
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                                  isSelected
                                    ? 'bg-[#B32446] text-white border-[#B32446]'
                                    : 'bg-[#FAF2EE] text-[#780616] border-[#780616]/10 hover:bg-[#F4ECE8]'
                                }`}
                              >
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Sangeet, Wedding Ceremony, Reception"
                          value={formData.ceremonyScope === 'Specific Ceremonies' ? '' : formData.ceremonyScope}
                          onChange={(e) => setFormData({ ...formData, ceremonyScope: e.target.value })}
                          className="w-full bg-[#FFFDF9] px-4 py-2 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C]"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Personal Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E1B19]">Personalized Imperial Dispatch Note</label>
                  <textarea
                    rows={3}
                    value={formData.personalNote}
                    onChange={(e) => setFormData({ ...formData, personalNote: e.target.value })}
                    className="w-full bg-[#FFFDF9] px-4 py-2 rounded-xl text-xs text-[#1E1B19] placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#7F560C] resize-none"
                  />
                </div>

                {/* Drawer Footer Actions inside Form */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#B32446] hover:bg-[#8F1633] text-white shadow-md text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Crown className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span>{isSubmitting ? 'Inscribing...' : 'Dispatch Imperial Invitation ✦'}</span>
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
