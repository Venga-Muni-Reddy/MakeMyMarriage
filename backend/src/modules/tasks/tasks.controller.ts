import { Request, Response, NextFunction } from 'express';
import { taskService } from './tasks.service';
import { ApiResponse } from '../../shared/response/api-response';

export class TaskController {
  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const { phase, category, priority, status, assignedToUserId, search } = req.query as Record<string, string>;
      const tasks = await taskService.getTasks(weddingId, {
        phase,
        category,
        priority,
        status,
        assignedToUserId,
        search,
      });
      return ApiResponse.success(res, { data: tasks });
    } catch (error) {
      next(error);
    }
  };

  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const telemetry = await taskService.getTelemetry(weddingId);
      return ApiResponse.success(res, { data: telemetry });
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const task = await taskService.createTask(weddingId, req.body);
      return ApiResponse.created(res, task, 'Royal milestone task created successfully');
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, taskId } = req.params;
      const task = await taskService.updateTask(weddingId, taskId, req.body);
      return ApiResponse.success(res, { data: task, message: 'Milestone task updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  toggleTaskComplete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, taskId } = req.params;
      const task = await taskService.toggleTaskComplete(weddingId, taskId);
      return ApiResponse.success(res, { data: task, message: 'Milestone completion updated' });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, taskId } = req.params;
      await taskService.deleteTask(weddingId, taskId);
      return ApiResponse.success(res, { data: null, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  seedTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const seeded = await taskService.seedTasks(weddingId);
      return ApiResponse.created(res, seeded, 'Royal Indian wedding milestones seeded successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController();
