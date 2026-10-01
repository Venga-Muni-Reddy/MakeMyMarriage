import prisma from '../../infrastructure/prisma/client';
import {
  TaskItem,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskTelemetry,
  TaskPriorityType,
  TaskStatusType,
} from './tasks.types';

function parseTaskDescription(desc: string | null) {
  if (!desc) {
    return {
      description: '',
      phase: '1–3 Months',
      category: 'General',
      vendorName: null,
      estimatedBudget: null,
      notes: null,
    };
  }
  try {
    if (desc.trim().startsWith('{') && desc.trim().endsWith('}')) {
      const parsed = JSON.parse(desc);
      return {
        description: parsed.description || '',
        phase: parsed.phase || '1–3 Months',
        category: parsed.category || 'General',
        vendorName: parsed.vendorName || null,
        estimatedBudget: parsed.estimatedBudget || null,
        notes: parsed.notes || null,
      };
    }
  } catch {}
  return {
    description: desc,
    phase: '1–3 Months',
    category: 'General',
    vendorName: null,
    estimatedBudget: null,
    notes: null,
  };
}

function encodeTaskDescription(data: {
  description?: string | null;
  phase?: string;
  category?: string;
  vendorName?: string | null;
  estimatedBudget?: string | null;
  notes?: string | null;
}) {
  return JSON.stringify({
    description: data.description || '',
    phase: data.phase || '1–3 Months',
    category: data.category || 'General',
    vendorName: data.vendorName || null,
    estimatedBudget: data.estimatedBudget || null,
    notes: data.notes || null,
  });
}

export class TaskRepository {
  async findMany(weddingId: string, filters?: {
    phase?: string;
    category?: string;
    priority?: string;
    status?: string;
    assignedToUserId?: string;
    search?: string;
  }): Promise<TaskItem[]> {
    const where: any = {
      weddingId,
      deletedAt: null,
    };

    if (filters?.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority as any;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status as any;
    }

    if (filters?.assignedToUserId && filters.assignedToUserId !== 'ALL') {
      where.assigneeId = filters.assignedToUserId;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    let result: TaskItem[] = tasks.map((t) => {
      const parsed = parseTaskDescription(t.description);
      return {
        id: t.id,
        weddingId: t.weddingId,
        assignedToUserId: t.assigneeId,
        assignedTo: t.assignee,
        title: t.title,
        description: parsed.description,
        category: parsed.category,
        priority: t.priority as TaskPriorityType,
        status: t.status as TaskStatusType,
        dueDate: t.dueAt ? t.dueAt.toISOString() : null,
        completedAt: t.status === 'COMPLETED' ? t.updatedAt.toISOString() : null,
        phase: parsed.phase,
        vendorName: parsed.vendorName || undefined,
        estimatedBudget: parsed.estimatedBudget || undefined,
        notes: parsed.notes || undefined,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    // Client-side filtering for category or phase
    if (filters?.category && filters.category !== 'ALL') {
      const cat = filters.category.toLowerCase();
      result = result.filter((r) => r.category.toLowerCase().includes(cat));
    }

    if (filters?.phase && filters.phase !== 'ALL') {
      const ph = filters.phase.toLowerCase();
      result = result.filter((r) => r.phase.toLowerCase().includes(ph));
    }

    return result;
  }

  async findById(weddingId: string, taskId: string): Promise<TaskItem | null> {
    const t = await prisma.task.findFirst({
      where: { id: taskId, weddingId, deletedAt: null },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });
    if (!t) return null;

    const parsed = parseTaskDescription(t.description);
    return {
      id: t.id,
      weddingId: t.weddingId,
      assignedToUserId: t.assigneeId,
      assignedTo: t.assignee,
      title: t.title,
      description: parsed.description,
      category: parsed.category,
      priority: t.priority as TaskPriorityType,
      status: t.status as TaskStatusType,
      dueDate: t.dueAt ? t.dueAt.toISOString() : null,
      completedAt: t.status === 'COMPLETED' ? t.updatedAt.toISOString() : null,
      phase: parsed.phase,
      vendorName: parsed.vendorName || undefined,
      estimatedBudget: parsed.estimatedBudget || undefined,
      notes: parsed.notes || undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  async create(weddingId: string, data: CreateTaskDTO, userId?: string): Promise<TaskItem> {
    let createdById = userId;
    if (!createdById) {
      const wedding = await prisma.wedding.findUnique({
        where: { id: weddingId },
        select: { ownerId: true },
      });
      createdById = wedding?.ownerId || 'system';
    }

    const encodedDescription = encodeTaskDescription({
      description: data.description,
      phase: data.phase,
      category: data.category,
      vendorName: data.vendorName,
      estimatedBudget: data.estimatedBudget,
      notes: data.notes,
    });

    const task = await prisma.task.create({
      data: {
        weddingId,
        title: data.title,
        description: encodedDescription,
        priority: (data.priority as any) || 'MEDIUM',
        status: (data.status as any) || 'TODO',
        dueAt: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assignedToUserId || null,
        createdById,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    const parsed = parseTaskDescription(task.description);
    return {
      id: task.id,
      weddingId: task.weddingId,
      assignedToUserId: task.assigneeId,
      assignedTo: task.assignee,
      title: task.title,
      description: parsed.description,
      category: parsed.category,
      priority: task.priority as TaskPriorityType,
      status: task.status as TaskStatusType,
      dueDate: task.dueAt ? task.dueAt.toISOString() : null,
      completedAt: null,
      phase: parsed.phase,
      vendorName: parsed.vendorName || undefined,
      estimatedBudget: parsed.estimatedBudget || undefined,
      notes: parsed.notes || undefined,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async update(weddingId: string, taskId: string, data: UpdateTaskDTO): Promise<TaskItem | null> {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, weddingId, deletedAt: null },
    });
    if (!existing) return null;

    const existingParsed = parseTaskDescription(existing.description);
    const updatedDescription = encodeTaskDescription({
      description: data.description !== undefined ? data.description : existingParsed.description,
      phase: data.phase !== undefined ? data.phase : existingParsed.phase,
      category: data.category !== undefined ? data.category : existingParsed.category,
      vendorName: data.vendorName !== undefined ? data.vendorName : existingParsed.vendorName,
      estimatedBudget: data.estimatedBudget !== undefined ? data.estimatedBudget : existingParsed.estimatedBudget,
      notes: data.notes !== undefined ? data.notes : existingParsed.notes,
    });

    const updateData: any = {
      description: updatedDescription,
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) {
      updateData.dueAt = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.assignedToUserId !== undefined) {
      updateData.assigneeId = data.assignedToUserId;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    const parsed = parseTaskDescription(updated.description);
    return {
      id: updated.id,
      weddingId: updated.weddingId,
      assignedToUserId: updated.assigneeId,
      assignedTo: updated.assignee,
      title: updated.title,
      description: parsed.description,
      category: parsed.category,
      priority: updated.priority as TaskPriorityType,
      status: updated.status as TaskStatusType,
      dueDate: updated.dueAt ? updated.dueAt.toISOString() : null,
      completedAt: updated.status === 'COMPLETED' ? updated.updatedAt.toISOString() : null,
      phase: parsed.phase,
      vendorName: parsed.vendorName || undefined,
      estimatedBudget: parsed.estimatedBudget || undefined,
      notes: parsed.notes || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async toggleComplete(weddingId: string, taskId: string): Promise<TaskItem | null> {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, weddingId, deletedAt: null },
    });
    if (!existing) return null;

    const newStatus = existing.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus as any,
        updatedAt: new Date(),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    const parsed = parseTaskDescription(updated.description);
    return {
      id: updated.id,
      weddingId: updated.weddingId,
      assignedToUserId: updated.assigneeId,
      assignedTo: updated.assignee,
      title: updated.title,
      description: parsed.description,
      category: parsed.category,
      priority: updated.priority as TaskPriorityType,
      status: updated.status as TaskStatusType,
      dueDate: updated.dueAt ? updated.dueAt.toISOString() : null,
      completedAt: updated.status === 'COMPLETED' ? updated.updatedAt.toISOString() : null,
      phase: parsed.phase,
      vendorName: parsed.vendorName || undefined,
      estimatedBudget: parsed.estimatedBudget || undefined,
      notes: parsed.notes || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async delete(weddingId: string, taskId: string): Promise<boolean> {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, weddingId, deletedAt: null },
    });
    if (!existing) return false;

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async getTelemetry(weddingId: string): Promise<TaskTelemetry> {
    const tasks = await prisma.task.findMany({
      where: { weddingId, deletedAt: null },
    });

    const now = Date.now();
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    let completedCount = 0;
    let inProgressCount = 0;
    let overdueCount = 0;
    let upcomingWeekCount = 0;

    const phaseStats = {
      sixMonths: { total: 0, completed: 0 },
      threeMonths: { total: 0, completed: 0 },
      weddingWeek: { total: 0, completed: 0 },
      dayOfVivah: { total: 0, completed: 0 },
    };

    for (const t of tasks) {
      const isCompleted = t.status === 'COMPLETED';
      if (isCompleted) completedCount++;
      if (t.status === 'IN_PROGRESS') inProgressCount++;

      // Overdue check
      if (!isCompleted && t.dueAt && t.dueAt.getTime() < now) {
        overdueCount++;
      }

      // Upcoming in next 7 days
      if (!isCompleted && t.dueAt && t.dueAt.getTime() >= now && t.dueAt.getTime() <= oneWeekFromNow) {
        upcomingWeekCount++;
      }

      // Phase breakdown
      const parsed = parseTaskDescription(t.description);
      const phase = parsed.phase.toLowerCase();

      if (phase.includes('6+') || phase.includes('foundation')) {
        phaseStats.sixMonths.total++;
        if (isCompleted) phaseStats.sixMonths.completed++;
      } else if (phase.includes('1–3') || phase.includes('attire') || phase.includes('month')) {
        phaseStats.threeMonths.total++;
        if (isCompleted) phaseStats.threeMonths.completed++;
      } else if (phase.includes('week') || phase.includes('logistics')) {
        phaseStats.weddingWeek.total++;
        if (isCompleted) phaseStats.weddingWeek.completed++;
      } else if (phase.includes('day') || phase.includes('vivah') || phase.includes('mandap')) {
        phaseStats.dayOfVivah.total++;
        if (isCompleted) phaseStats.dayOfVivah.completed++;
      }
    }

    const total = tasks.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      totalTasks: total,
      completedTasks: completedCount,
      inProgressTasks: inProgressCount,
      overdueTasks: overdueCount,
      upcomingWeekTasks: upcomingWeekCount,
      completionPercentage: pct,
      phaseCounts: {
        all: total,
        sixMonths: phaseStats.sixMonths,
        threeMonths: phaseStats.threeMonths,
        weddingWeek: phaseStats.weddingWeek,
        dayOfVivah: phaseStats.dayOfVivah,
      },
    };
  }

  async seedRoyalMilestones(weddingId: string, userId?: string): Promise<TaskItem[]> {
    const SEED_TASKS = [
      {
        title: 'Finalize Mandap Fresh Marigold & Jasmine Floral Ceiling',
        description: 'Floating mandap floral canopy with heritage brass hanging lamps and fresh white jasmine chhadis.',
        category: 'Decor & Florals',
        priority: 'URGENT',
        phase: 'Wedding Week',
        vendorName: 'Mewar Royal Decorators',
        estimatedBudget: '₹2,50,000',
        dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Arrange Hand-Carved Vintage Royal Doli for Bride Grand Mandap Arrival',
        description: 'Traditional gilded royal palanquin with 8 traditional ceremonial bearers and flower escort.',
        category: 'Hospitality',
        priority: 'URGENT',
        phase: 'Wedding Week',
        vendorName: 'Udaipur Royal Carriage Guild',
        estimatedBudget: '₹95,000',
        dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000), // Overdue for demo
        status: 'TODO',
      },
      {
        title: 'Review Sangeet Choreography Troupe Playlist & Audio-Visual Cue Sheet',
        description: 'Sound check, couple grand entry track mastering, family performance sequence and LED backdrop graphics.',
        category: 'Rituals',
        priority: 'HIGH',
        phase: '1–3 Months',
        vendorName: 'Mumbai Imperial Dancers',
        estimatedBudget: '₹1,80,000',
        dueDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        status: 'IN_PROGRESS',
      },
      {
        title: 'Verify Saatvik & Jain Mithai Tastings with Head Royal Halwai',
        description: 'Sampling Kesariya Ghevar, Badam Halwa, Mawa Kachori, and sugar-free royal sweet assortments.',
        category: 'Catering',
        priority: 'MEDIUM',
        phase: '1–3 Months',
        vendorName: 'Nathdwara Rasoi',
        estimatedBudget: '₹3,20,000',
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Safas & Royal Turban Tying Master Coordination',
        description: '250 ceremonial Leheriya & Pachranga turbans with jeweled Kalgi for groom procession.',
        category: 'Wardrobe',
        priority: 'HIGH',
        phase: 'Wedding Week',
        vendorName: 'Jodhpur Pagri Karigars',
        estimatedBudget: '₹1,40,000',
        dueDate: new Date(Date.now() + 11 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Finalize Lake Palace Jetty Charter Boats for Guest Transit',
        description: 'Exclusive private heritage motorboats connecting Bansi Ghat jetty to Jagmandir Island courtyard.',
        category: 'Hospitality',
        priority: 'HIGH',
        phase: '6+ Months',
        vendorName: 'Lake Pichola Flotilla',
        estimatedBudget: '₹3,50,000',
        dueDate: new Date(Date.now() - 30 * 24 * 3600 * 1000),
        status: 'COMPLETED',
      },
      {
        title: 'Panditji Samagri & Havan Kund Copper Vessels Verification',
        description: 'Auspicious samagri list: desi ghee, mango wood, navagraha samidha, gangajal, and raw silk havan mats.',
        category: 'Rituals',
        priority: 'HIGH',
        phase: 'Day of Vivah',
        vendorName: 'Eklingji Temple Trust',
        estimatedBudget: '₹45,000',
        dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Jaimala Fresh Rose Garlands with Golden Kalgi Delivery',
        description: 'Two imperial 8-foot intertwined red and blush English rose garlands delivered on ice to Mandap suites.',
        category: 'Decor & Florals',
        priority: 'URGENT',
        phase: 'Day of Vivah',
        vendorName: 'Pushkar Flower Mandi',
        estimatedBudget: '₹35,000',
        dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Royal Shehnai & Nagada Troupe Welcome Fanfare at Toran Gate',
        description: '12-member classical Shehnai ensemble playing Raga Yaman and welcoming Baraat arrival.',
        category: 'Rituals',
        priority: 'HIGH',
        phase: 'Day of Vivah',
        vendorName: 'Udaipur Palace Troupe',
        estimatedBudget: '₹65,000',
        dueDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        status: 'TODO',
      },
      {
        title: 'Cinematic Drone & Candid Royal Wedding Photography Retainers',
        description: 'Multi-camera team, drone flight permissions over City Palace complex, and same-day highlights reel.',
        category: 'Photography',
        priority: 'MEDIUM',
        phase: '6+ Months',
        vendorName: 'Stories by Joseph',
        estimatedBudget: '₹4,00,000',
        dueDate: new Date(Date.now() - 45 * 24 * 3600 * 1000),
        status: 'COMPLETED',
      },
    ];

    const createdTasks: TaskItem[] = [];
    for (const item of SEED_TASKS) {
      const task = await this.create(weddingId, {
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority as TaskPriorityType,
        status: item.status as TaskStatusType,
        phase: item.phase,
        vendorName: item.vendorName,
        estimatedBudget: item.estimatedBudget,
        dueDate: item.dueDate.toISOString(),
      }, userId);
      createdTasks.push(task);
    }

    return createdTasks;
  }
}

export const taskRepository = new TaskRepository();
