import { Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class EventController {
  getEvents = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List events endpoint scaffolded', data: [] });
  };

  getEvent = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Get event endpoint scaffolded' });
  };

  createEvent = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create event endpoint scaffolded');
  };

  updateEvent = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Update event endpoint scaffolded' });
  };

  deleteEvent = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Delete event endpoint scaffolded' });
  };
}

export const eventController = new EventController();
