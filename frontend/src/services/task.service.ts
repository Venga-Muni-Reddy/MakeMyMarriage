import api from './api';

export type TaskPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatusType = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export interface TaskItem {
  id: string;
  weddingId: string;
  assignedToUserId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriorityType;
  status: TaskStatusType;
  dueDate?: string | null;
  completedAt?: string | null;
  phase: string;
  vendorName?: string;
  estimatedBudget?: string;
  checklistCount?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTelemetry {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  upcomingWeekTasks: number;
  completionPercentage: number;
  phaseCounts: {
    all: number;
    sixMonths: { total: number; completed: number };
    threeMonths: { total: number; completed: number };
    weddingWeek: { total: number; completed: number };
    dayOfVivah: { total: number; completed: number };
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  category?: string;
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  dueDate?: string;
  assignedToUserId?: string;
  phase?: string;
  vendorName?: string;
  estimatedBudget?: string;
  notes?: string;
}

export const taskService = {
  async getTasks(
    weddingId: string,
    filters?: {
      phase?: string;
      category?: string;
      priority?: string;
      status?: string;
      assignedToUserId?: string;
      search?: string;
    }
  ): Promise<TaskItem[]> {
    const res: any = await api.get(`/weddings/${weddingId}/tasks`, { params: filters });
    return res?.data ?? res;
  },

  async getTelemetry(weddingId: string): Promise<TaskTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/tasks/telemetry`);
    return res?.data ?? res;
  },

  async createTask(weddingId: string, payload: CreateTaskPayload): Promise<TaskItem> {
    const res: any = await api.post(`/weddings/${weddingId}/tasks`, payload);
    return res?.data ?? res;
  },

  async updateTask(weddingId: string, taskId: string, payload: Partial<CreateTaskPayload>): Promise<TaskItem> {
    const res: any = await api.patch(`/weddings/${weddingId}/tasks/${taskId}`, payload);
    return res?.data ?? res;
  },

  async toggleTask(weddingId: string, taskId: string): Promise<TaskItem> {
    const res: any = await api.patch(`/weddings/${weddingId}/tasks/${taskId}/toggle`);
    return res?.data ?? res;
  },

  async deleteTask(weddingId: string, taskId: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/tasks/${taskId}`);
  },

  async seedTasks(weddingId: string): Promise<TaskItem[]> {
    const res: any = await api.post(`/weddings/${weddingId}/tasks/seed`);
    return res?.data ?? res;
  },
};
