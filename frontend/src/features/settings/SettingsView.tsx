import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { weddingService, WeddingMemberItem } from '../../services/wedding.service';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Crown,
  Sparkles,
  Building,
  Key,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { currentWedding, refreshWeddings } = useWedding();
  const { user: currentUser } = useAuth();
  const weddingId = currentWedding?.id;

  const [members, setMembers] = useState<WeddingMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'ORGANIZER' | 'COLLABORATOR' | 'VIEWER'>('ORGANIZER');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadMembers = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const data = await weddingService.getMembers(weddingId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load wedding members', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [weddingId]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId) return;
    if (!targetEmail.trim()) {
      showToast('Please provide a registered user email address');
      return;
    }

    setIsAssigning(true);
    try {
      await weddingService.assignMemberRole(weddingId, targetEmail.trim(), targetRole);
      showToast(`Successfully granted role "${targetRole}" to ${targetEmail}`);
      setTargetEmail('');
      loadMembers();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to assign role. Make sure the user has signed up first.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleInlineRoleChange = async (memberUserEmail: string, newRole: string) => {
    if (!weddingId) return;
    try {
      await weddingService.assignMemberRole(weddingId, memberUserEmail, newRole);
      showToast(`Updated role to "${newRole}" for ${memberUserEmail}`);
      loadMembers();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update member role');
    }
  };

  const currentMemberRecord = members.find((m) => m.userId === currentUser?.id);
  const isOwner = currentMemberRecord?.role?.name === 'OWNER' || currentWedding?.ownerId === currentUser?.id;

  const handleDeleteWedding = async () => {
    if (!weddingId || !isOwner) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm workspace destruction.');
      return;
    }

    setIsDeleting(true);
    try {
      await weddingService.deleteWedding(weddingId);
      showToast('Royal wedding workspace has been successfully deleted.');
      setIsDeleteModalOpen(false);
      await refreshWeddings();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Failed to delete wedding workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const roleDescriptions: Record<string, { label: string; badge: string; desc: string }> = {
    OWNER: {
      label: 'Imperial Owner',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Sovereign administrative authority over all ceremonies, finances, and workspace tenancy.',
    },
    ORGANIZER: {
      label: 'Royal Organizer',
      badge: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Operational authority: manage ceremonial itinerary, guest list, RSVPs, and invitation dispatch.',
    },
    COLLABORATOR: {
      label: 'Family Collaborator',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
      desc: 'Delegated authority: assign Mandap seating, manage tasks, coordinate guest quarters.',
    },
    VIEWER: {
      label: 'Guest Viewer',
      badge: 'bg-stone-100 text-stone-800 border-stone-300',
      desc: 'Read-only access to ceremonial itineraries and schedules.',
    },
  };

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-on-surface text-surface px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slideUp border border-outline-variant/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Access Control &amp; Tenancy
            </span>
          </div>
          <h1 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            Workspace Settings &amp; Team Roles
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            Manage your royal wedding tenancy, assign operational roles to planners and family members, and oversee workspace authority.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Your Role: {isOwner ? 'OWNER (Sovereign)' : currentMemberRecord?.role?.name || 'MEMBER'}</span>
          </span>
        </div>
      </div>

      {/* Top Split: Workspace Info + Role Granting Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Workspace Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/30">
            <Building className="w-4 h-4 text-primary" />
            <h3 className="font-headline-sm font-bold text-base text-on-surface">Royal Workspace Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-on-surface-variant block text-[11px] font-medium">Wedding Title</span>
              <span className="font-headline-md font-bold text-base text-on-surface">
                {currentWedding?.name || 'Royal Vivaha'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-on-surface-variant block text-[11px] font-medium">Workspace Slug</span>
                <span className="font-mono text-primary font-semibold">/w/{currentWedding?.slug}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-[11px] font-medium">Primary Venue</span>
                <span className="font-semibold text-on-surface truncate block">
                  {currentWedding?.settings?.primaryVenueName || 'The Leela Palace'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-on-surface-variant">
              <span>Workspace ID:</span>
              <span className="font-mono text-[11px]">{weddingId?.substring(0, 18)}...</span>
            </div>
          </div>
        </div>

        {/* Role Assignment Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <h3 className="font-headline-sm font-bold text-base text-on-surface">Assign Role to Collaborator</h3>
            </div>
            <span className="text-[11px] text-on-surface-variant">Multi-Tenant Access</span>
          </div>

          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Collaborator User Email
              </label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="e.g. elon@gmail.com"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                User must already be registered with MakeMyMarriage.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Select Imperial Authority / Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'ORGANIZER',
                    title: 'ORGANIZER',
                    subtitle: 'Full Itinerary & Guest Control',
                  },
                  {
                    id: 'COLLABORATOR',
                    title: 'COLLABORATOR',
                    subtitle: 'Seating & Task Coordination',
                  },
                  {
                    id: 'VIEWER',
                    title: 'VIEWER',
                    subtitle: 'Read-Only Family Preview',
                  },
                ].map((r) => {
                  const isSelected = targetRole === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setTargetRole(r.id as any)}
                      className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-bold'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40'
                      }`}
                    >
                      <div className="text-xs font-bold">{r.title}</div>
                      <div className="text-[10px] text-on-surface-variant font-normal mt-0.5">
                        {r.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed">
              <strong>Granted Scope:</strong> {roleDescriptions[targetRole]?.desc}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isAssigning}
                className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>{isAssigning ? 'Granting Authority...' : 'Grant Imperial Role'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Workspace Members Manifest Table */}
      <div className="p-7 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-headline-md font-bold text-lg text-on-surface">
                Workspace Collaborators &amp; Assigned Roles
              </h2>
              <p className="text-xs text-on-surface-variant">
                Users who have sovereign, operational, or view-only access to this specific wedding.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
            {members.length} Active Collaborators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                <th className="py-3 px-4">Collaborator</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4">Joined At</th>
                <th className="py-3 px-4 text-right">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading workspace authorities...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                    No collaborators found for this workspace.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const roleMeta = roleDescriptions[m.role.name] || roleDescriptions['VIEWER'];
                  const isItemOwner = m.role.name === 'OWNER';

                  return (
                    <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed/40 text-primary font-bold flex items-center justify-center text-xs">
                            {m.user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-on-surface block">{m.user.name}</span>
                            {m.userId === currentUser?.id && (
                              <span className="text-[10px] text-primary font-semibold">(You)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface">
                        {m.user.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleMeta.badge}`}
                        >
                          {m.role.name === 'OWNER' && <Crown className="w-3 h-3 mr-1 text-amber-600" />}
                          {m.role.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Active Member'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isItemOwner ? (
                          <span className="text-[11px] text-on-surface-variant italic">Permanent Sovereign</span>
                        ) : isOwner ? (
                          <select
                            value={m.role.name}
                            onChange={(e) => handleInlineRoleChange(m.user.email, e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="COLLABORATOR">COLLABORATOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant">Owner Managed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DANGER ZONE (OWNER ONLY) */}
      {/* ========================================================================= */}
      <div className="p-7 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-rose-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md font-bold text-lg text-rose-950">
                Danger Zone: Workspace Destruction
              </h2>
              <p className="text-xs text-rose-800/80">
                Permanently decommission this wedding workspace, guest rolls, ceremonies, and invitations.
              </p>
            </div>
          </div>

          {isOwner ? (
            <button
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Wedding Workspace</span>
            </button>
          ) : (
            <span className="text-xs text-rose-800 font-medium px-3 py-1.5 rounded-lg bg-rose-100/60 border border-rose-200/50">
              Restricted to Sovereign Owner
            </span>
          )}
        </div>

        <div className="text-xs text-rose-900/70 leading-relaxed">
          <p>
            <strong>Note on data lifecycle:</strong> Deleting this wedding will immediately remove it from all collaborator rosters and revoke all digital invitations and QR passes. This action cannot be reversed.
          </p>
        </div>
      </div>

      {/* Two-Step Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-300 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-headline-md font-bold text-lg text-on-surface">
                  Delete Wedding Workspace?
                </h3>
                <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                  Irreversible Destruction
                </span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              You are about to permanently delete{' '}
              <strong className="text-on-surface font-semibold">
                "{currentWedding?.name || 'this wedding workspace'}"
              </strong>
              . All scheduled rituals, guest records, and digital invitations will be decommissioned.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                To confirm, type <span className="font-mono text-rose-600 font-bold">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-surface-container-low border border-rose-200 text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWedding}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
