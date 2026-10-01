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
  description?: string | null;
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

export interface CreateTaskDTO {
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

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  category?: string;
  priority?: TaskPriorityType;
  status?: TaskStatusType;
  dueDate?: string;
  assignedToUserId?: string | null;
  phase?: string;
  vendorName?: string;
  estimatedBudget?: string;
  notes?: string;
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
