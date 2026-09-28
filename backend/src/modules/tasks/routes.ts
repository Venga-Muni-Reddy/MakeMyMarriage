import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class TaskController {
  getTasks = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List tasks endpoint scaffolded', data: [] });
  };
  createTask = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create task endpoint scaffolded');
  };
  updateTask = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Update task endpoint scaffolded' });
  };
  deleteTask = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Delete task endpoint scaffolded' });
  };
}

export const taskController = new TaskController();
export const taskService = {};
export const taskRepository = {};

export const taskRouter = Router({ mergeParams: true });
taskRouter.get('/', taskController.getTasks);
taskRouter.post('/', taskController.createTask);
taskRouter.patch('/:taskId', taskController.updateTask);
taskRouter.delete('/:taskId', taskController.deleteTask);
