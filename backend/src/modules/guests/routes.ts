import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class GuestController {
  getGuests = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List guests endpoint scaffolded', data: [] });
  };
  getGuest = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Get guest endpoint scaffolded' });
  };
  createGuest = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create guest endpoint scaffolded');
  };
  updateGuest = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Update guest endpoint scaffolded' });
  };
  deleteGuest = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Delete guest endpoint scaffolded' });
  };
}

export const guestController = new GuestController();
export const guestService = {};
export const guestRepository = {};

export const guestRouter = Router({ mergeParams: true });
guestRouter.get('/', guestController.getGuests);
guestRouter.post('/', guestController.createGuest);
guestRouter.get('/:guestId', guestController.getGuest);
guestRouter.patch('/:guestId', guestController.updateGuest);
guestRouter.delete('/:guestId', guestController.deleteGuest);
