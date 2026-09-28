export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public errors?: any) {
    super(message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors?: any) {
    super(400, message, errors);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict', errors?: any) {
    super(409, message, errors);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors?: any) {
    super(422, message, errors);
  }
}

