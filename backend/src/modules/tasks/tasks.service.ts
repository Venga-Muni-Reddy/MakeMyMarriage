import { taskRepository } from './tasks.repository';
import { CreateTaskDTO, UpdateTaskDTO } from './tasks.types';

export class TaskService {
  async getTasks(weddingId: string, filters?: {
    phase?: string;
    category?: string;
    priority?: string;
    status?: string;
    assignedToUserId?: string;
    search?: string;
  }) {
    if (!weddingId) throw new Error('Wedding ID is required');
    return taskRepository.findMany(weddingId, filters);
  }

  async getTelemetry(weddingId: string) {
    if (!weddingId) throw new Error('Wedding ID is required');
    return taskRepository.getTelemetry(weddingId);
  }

  async createTask(weddingId: string, data: CreateTaskDTO) {
    if (!weddingId) throw new Error('Wedding ID is required');
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Task title is required');
    }
    return taskRepository.create(weddingId, data);
  }

  async updateTask(weddingId: string, taskId: string, data: UpdateTaskDTO) {
    if (!weddingId || !taskId) throw new Error('Wedding ID and Task ID are required');
    const updated = await taskRepository.update(weddingId, taskId, data);
    if (!updated) throw new Error(`Task with ID ${taskId} not found`);
    return updated;
  }

  async toggleTaskComplete(weddingId: string, taskId: string) {
    if (!weddingId || !taskId) throw new Error('Wedding ID and Task ID are required');
    const toggled = await taskRepository.toggleComplete(weddingId, taskId);
    if (!toggled) throw new Error(`Task with ID ${taskId} not found`);
    return toggled;
  }

  async deleteTask(weddingId: string, taskId: string) {
    if (!weddingId || !taskId) throw new Error('Wedding ID and Task ID are required');
    const deleted = await taskRepository.delete(weddingId, taskId);
    if (!deleted) throw new Error(`Task with ID ${taskId} not found`);
    return { success: true };
  }

  async seedTasks(weddingId: string) {
    if (!weddingId) throw new Error('Wedding ID is required');
    return taskRepository.seedRoyalMilestones(weddingId);
  }
}

export const taskService = new TaskService();
