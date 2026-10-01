import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWedding } from '../../context/WeddingContext';
import {
  taskService,
  TaskItem,
  TaskTelemetry,
  TaskPriorityType,
  CreateTaskPayload,
} from '../../services/task.service';
import {
  Check,
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Trash2,
  Edit,
  X,
  Store,
  DollarSign,
  Layers,
  LayoutList,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Decor & Florals', label: 'Decor & Florals', icon: '🌺' },
  { id: 'Hospitality', label: 'Hospitality & Logistics', icon: '🏨' },
  { id: 'Rituals', label: 'Rituals & Puja', icon: '🪷' },
  { id: 'Catering', label: 'Catering & Mithai', icon: '🍯' },
  { id: 'Wardrobe', label: 'Wardrobe & Jewels', icon: '👗' },
  { id: 'Photography', label: 'Photography', icon: '📸' },
  { id: 'General', label: 'General Protocol', icon: '👑' },
];

const PHASES = [
  { id: 'ALL', label: 'All Milestones' },
  { id: '6+', label: '6+ Months: Foundation' },
  { id: '1–3', label: '1–3 Months: Attire & Invites' },
  { id: 'Week', label: 'Wedding Week: Logistics' },
  { id: 'Day', label: 'Day of Vivah: Mandap' },
];

export const TasksView: React.FC = () => {
  const { currentWedding } = useWedding();
  const { weddingId: routeWeddingId } = useParams<{ weddingId?: string }>();
  const activeWeddingId = routeWeddingId || currentWedding?.id;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [telemetry, setTelemetry] = useState<TaskTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'CHECKLIST' | 'KANBAN'>('CHECKLIST');
  const [activePhase, setActivePhase] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('Decor & Florals');
  const [taskPriority, setTaskPriority] = useState<TaskPriorityType>('HIGH');
  const [taskPhase, setTaskPhase] = useState('Wedding Week');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskVendorName, setTaskVendorName] = useState('');
  const [taskEstimatedBudget, setTaskEstimatedBudget] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Collapsed sections in Checklist View
  const [showCompleted, setShowCompleted] = useState(true);

  const loadData = async (refreshIndicator = false) => {
    if (!activeWeddingId) return;
    if (refreshIndicator) setIsRefreshing(true);

    try {
      const [taskList, telem] = await Promise.all([
        taskService.getTasks(activeWeddingId, {
          phase: activePhase !== 'ALL' ? activePhase : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          search: searchQuery || undefined,
        }),
        taskService.getTelemetry(activeWeddingId),
      ]);

      setTasks(taskList);
      setTelemetry(telem);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWeddingId, activePhase, categoryFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeWeddingId) {
        taskService.getTasks(activeWeddingId, {
          phase: activePhase !== 'ALL' ? activePhase : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          search: searchQuery || undefined,
        })
          .then(setTasks)
          .catch(console.error);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle Task Completion
  const handleToggle = async (task: TaskItem) => {
    if (!activeWeddingId) return;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' }
          : t
      )
    );

    try {
      await taskService.toggleTask(activeWeddingId, task.id);
      const updatedTelem = await taskService.getTelemetry(activeWeddingId);
      setTelemetry(updatedTelem);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      loadData();
    }
  };

  // Delete Task
  const handleDelete = async (taskId: string) => {
    if (!activeWeddingId || !window.confirm('Are you sure you want to remove this milestone task?')) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await taskService.deleteTask(activeWeddingId, taskId);
      const updatedTelem = await taskService.getTelemetry(activeWeddingId);
      setTelemetry(updatedTelem);
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadData();
    }
  };

  // Seed Royal Milestones
  const handleSeed = async () => {
    if (!activeWeddingId) return;
    setIsSeeding(true);
    try {
      await taskService.seedTasks(activeWeddingId);
      await loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to seed royal milestone checklist');
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskCategory('Decor & Florals');
    setTaskPriority('HIGH');
    setTaskPhase('Wedding Week');
    setTaskDueDate('');
    setTaskVendorName('');
    setTaskEstimatedBudget('');
    setTaskNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskCategory(task.category || 'General');
    setTaskPriority(task.priority);
    setTaskPhase(task.phase || 'Wedding Week');
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskVendorName(task.vendorName || '');
    setTaskEstimatedBudget(task.estimatedBudget || '');
    setTaskNotes(task.notes || '');
    setIsModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeddingId || !taskTitle.trim()) return;

    setIsSaving(true);
    try {
      const payload: CreateTaskPayload = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        category: taskCategory,
        priority: taskPriority,
        phase: taskPhase,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        vendorName: taskVendorName.trim() || undefined,
        estimatedBudget: taskEstimatedBudget.trim() || undefined,
        notes: taskNotes.trim() || undefined,
      };

      if (editingTask) {
        await taskService.updateTask(activeWeddingId, editingTask.id, payload);
      } else {
        await taskService.createTask(activeWeddingId, payload);
      }

      setIsModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save milestone task');
    } finally {
      setIsSaving(false);
    }
  };

  // Grouped tasks
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending: TaskItem[] = [];
    const completed: TaskItem[] = [];

    tasks.forEach((t) => {
      if (t.status === 'COMPLETED') {
        completed.push(t);
      } else {
        pending.push(t);
      }
    });

    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  const completionPct = telemetry?.completionPercentage || 0;

  if (isLoading && !telemetry) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-serif text-stone-600 text-sm">Consulting Rajputana Vivaha Operations Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fadeIn font-sans">
      {/* Top Ambience & Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="text-primary font-medium">City Palace &amp; Jagmandir Island</span>
          <span>/</span>
          <span className="text-stone-800 font-semibold">Vivaha Operations Console</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-secondary text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Shubh Muhurtham Active Engine</span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================
          1. PLANNING PROGRESS & COUNTDOWN TELEMETRY BANNER
      ======================================================== */}
      <div className="relative rounded-2xl bg-white border border-stone-200 p-5 sm:p-7 shadow-sm overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Rajputana Vivaha Protocol</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Wedding Planning &amp; Milestone Operations
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Track milestone readiness, assign sacred ritual duties, verify vendor retainers, and orchestrate lake palace arrival protocols with ceremonial precision.
            </p>

            {/* View Switcher Toggle */}
            <div className="pt-2 inline-flex p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('CHECKLIST')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'CHECKLIST'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 text-primary" />
                <span>Checklist View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'KANBAN'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Kanban Board</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-stone-200"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{isSeeding ? 'Seeding...' : '✦ Seed Royal Checklist'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-secondary hover:bg-secondary/95 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Royal Task</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 pt-4 border-t border-stone-100 items-stretch">
          {/* Radial Progress Meter (4 cols) */}
          <div className="xl:col-span-4 bg-stone-50/80 border border-stone-200 p-4 rounded-xl flex items-center gap-4 shadow-2xs">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-stone-200 fill-none"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary fill-none transition-all duration-700"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * completionPct) / 100}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-serif font-bold text-xl text-stone-900 leading-none">
                  {completionPct}%
                </span>
                <span className="text-[9px] uppercase font-bold text-primary tracking-wider mt-0.5">
                  Ready
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  Milestone Execution
                </span>
                <span className="font-bold text-primary">
                  {telemetry?.completedTasks ?? 0} / {telemetry?.totalTasks ?? 0} Done
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>{(telemetry?.totalTasks ?? 0) - (telemetry?.completedTasks ?? 0)} Pending Actions</span>
                <span className="text-secondary font-bold">
                  {telemetry?.overdueTasks ?? 0} Flagged Urgent
                </span>
              </div>
            </div>
          </div>

          {/* Shubh Muhurtham Live Card (3 cols) */}
          <div className="xl:col-span-3 bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Shubh Muhurtham
              </span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            <div className="my-1">
              <p className="font-serif text-xl sm:text-2xl font-bold text-secondary">
                ✦ 78 Days ✦
              </p>
              <p className="text-xs font-semibold text-stone-800">
                Vivah Lagna: 07:18 PM
              </p>
            </div>
            <div className="text-[11px] text-stone-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" />
              <span>Rohini Nakshatra • Jagmandir Mandap</span>
            </div>
          </div>

          {/* 4 Quick Stat Tiles (5 cols) */}
          <div className="xl:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 bg-stone-50 rounded-xl flex flex-col justify-between border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500">Overdue</span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-xl font-bold text-secondary">
                  {telemetry?.overdueTasks ?? 0}
                </span>
                <span className="text-[10px] text-secondary font-bold">Urgent</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl flex flex-col justify-between border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500">In Progress</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-xl font-bold text-stone-900">
                  {telemetry?.inProgressTasks ?? 0}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">Active</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl flex flex-col justify-between border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500">Upcoming</span>
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-xl font-bold text-stone-900">
                  {telemetry?.upcomingWeekTasks ?? 0}
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">Week</span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl flex flex-col justify-between border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-500">Completed</span>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-xl font-bold text-emerald-800">
                  {telemetry?.completedTasks ?? 0}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Done</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CHRONOLOGICAL PHASES NAVIGATION TABS
      ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {PHASES.map((ph) => {
          const isActive = activePhase === ph.id;
          return (
            <button
              key={ph.id}
              onClick={() => setActivePhase(ph.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              <span>{ph.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          3. SEARCH & CATEGORY FILTER BAR
      ======================================================== */}
      <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, vendors, rituals..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs text-stone-700 font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories (🪷, 🌺, 🍯, 👗)</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs text-stone-700 font-semibold focus:outline-none"
          >
            <option value="ALL">Priority: All</option>
            <option value="URGENT">Urgent ⚡</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <span className="text-xs text-stone-500 font-medium px-2">
            {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* ========================================================
          4. TASK LIST (CHECKLIST OR KANBAN VIEW)
      ======================================================== */}
      {viewMode === 'CHECKLIST' ? (
        <div className="space-y-6">
          {/* Active Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Immediate Active Actions
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold">
                  {pendingTasks.length} pending
                </span>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-400 text-xs italic">
                No active tasks found in this phase. Great job!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.map((task) => {
                  const isUrgent = task.priority === 'URGENT';
                  const isOverdue =
                    task.dueDate && new Date(task.dueDate).getTime() < Date.now();

                  return (
                    <div
                      key={task.id}
                      className={`group bg-white hover:bg-stone-50/80 transition-all rounded-xl p-4 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isUrgent ? 'border-l-4 border-l-secondary' : 'border-stone-200'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggle(task)}
                          className="mt-0.5 w-6 h-6 rounded-full border border-stone-300 hover:border-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <span className="sr-only">Mark complete</span>
                        </button>

                        <div className="flex flex-col gap-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                              <span>{task.category}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isUrgent
                                  ? 'bg-secondary text-white'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {isUrgent ? '⚡ URGENT' : task.priority}
                            </span>

                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                            {task.title}
                          </h3>

                          {/* Description & Vendor Details */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                            {task.vendorName && (
                              <span className="inline-flex items-center gap-1 text-primary font-medium">
                                <Store className="w-3.5 h-3.5" />
                                <span>{task.vendorName}</span>
                              </span>
                            )}
                            {task.estimatedBudget && (
                              <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                                <DollarSign className="w-3.5 h-3.5 text-primary" />
                                <span>{task.estimatedBudget}</span>
                              </span>
                            )}
                            {task.description && (
                              <span className="text-stone-400 italic truncate max-w-sm">
                                {task.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-semibold">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                            title="Edit task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-stone-200 opacity-90">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Completed &amp; Verified Palace Operations
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    {completedTasks.length} cleared
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {showCompleted ? 'Hide Completed' : `Show All (${completedTasks.length})`}
                </button>
              </div>

              {showCompleted && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-stone-50/70 rounded-xl p-3.5 border border-stone-200/70 flex items-center justify-between gap-3 text-stone-500"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(task)}
                          className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-sm line-through text-stone-500">
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          ✓ Verified Complete
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: TODO */}
          <div className="bg-stone-100/70 p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-stone-800">
                To Inscribe (Todo)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">
                {pendingTasks.filter((t) => t.status === 'TODO').length}
              </span>
            </div>
            <div className="space-y-2.5">
              {pendingTasks
                .filter((t) => t.status === 'TODO')
                .map((task) => (
                  <div key={task.id} className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
                    <div className="font-bold text-xs text-stone-900">{task.title}</div>
                    <div className="flex justify-between items-center text-[10px] text-stone-500">
                      <span>{task.category}</span>
                      <button onClick={() => handleToggle(task)} className="text-primary font-bold hover:underline">
                        Complete →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 2: IN_PROGRESS */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-amber-950">
                In Realization (Active)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                {pendingTasks.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="space-y-2.5">
              {pendingTasks
                .filter((t) => t.status === 'IN_PROGRESS')
                .map((task) => (
                  <div key={task.id} className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2">
                    <div className="font-bold text-xs text-stone-900">{task.title}</div>
                    <div className="flex justify-between items-center text-[10px] text-stone-500">
                      <span>{task.category}</span>
                      <button onClick={() => handleToggle(task)} className="text-emerald-700 font-bold hover:underline">
                        Done ✓
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-emerald-950">
                Verified Complete
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold">
                {completedTasks.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2 opacity-80">
                  <div className="font-serif text-xs line-through text-stone-500">{task.title}</div>
                  <div className="flex justify-between items-center text-[10px] text-stone-400">
                    <span>{task.category}</span>
                    <button onClick={() => handleToggle(task)} className="text-stone-500 hover:underline">
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. CREATE / EDIT ROYAL TASK MODAL
      ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {editingTask ? 'Edit Milestone Task' : 'Inscribe Royal Milestone Task'}
                </h3>
                <p className="text-xs text-stone-500">
                  Set ceremony deliverables, vendor allocations, and countdown deadlines
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Finalize Mandap Marigold Canopy..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Chronological Phase
                  </label>
                  <select
                    value={taskPhase}
                    onChange={(e) => setTaskPhase(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="6+ Months">6+ Months: Foundation</option>
                    <option value="1–3 Months">1–3 Months: Attire &amp; Invites</option>
                    <option value="Wedding Week">Wedding Week: Logistics</option>
                    <option value="Day of Vivah">Day of Vivah: Mandap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="URGENT">Urgent ⚡</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Vendor Partner (Optional)
                  </label>
                  <input
                    type="text"
                    value={taskVendorName}
                    onChange={(e) => setTaskVendorName(e.target.value)}
                    placeholder="e.g. Mewar Royal Decorators"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Estimated Budget
                  </label>
                  <input
                    type="text"
                    value={taskEstimatedBudget}
                    onChange={(e) => setTaskEstimatedBudget(e.target.value)}
                    placeholder="e.g. ₹2,50,000"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description &amp; Requirements
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="Details for the wedding coordinators..."
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
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Inscribing...' : editingTask ? 'Update Milestone' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
