import { Router } from 'express';
import { taskController } from './tasks.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember } from '../../middleware/wedding.middleware';

export const taskRouter = Router({ mergeParams: true });

taskRouter.use(requireAuth, requireWeddingMember);

taskRouter.get('/', taskController.getTasks);
taskRouter.get('/telemetry', taskController.getTelemetry);
taskRouter.post('/', taskController.createTask);
taskRouter.post('/seed', taskController.seedTasks);
taskRouter.patch('/:taskId', taskController.updateTask);
taskRouter.patch('/:taskId/toggle', taskController.toggleTaskComplete);
taskRouter.delete('/:taskId', taskController.deleteTask);
