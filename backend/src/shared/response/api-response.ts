import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, { statusCode = 200, message = 'Success', data = null }: any = {}) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static created(res: Response, data: any = null, message = 'Resource created') {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }
}
