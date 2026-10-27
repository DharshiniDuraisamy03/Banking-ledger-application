import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/index.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  // 1. Handled AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      error: err.errorCode,
      message: err.message,
      details: err.details,
      timestamp,
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const issues = err.issues || (err as any).errors || [];
    const formattedIssues = issues.map((i: any) => ({
      path: Array.isArray(i.path) ? i.path.join('.') : String(i.path || ''),
      message: i.message,
    }));

    res.status(400).json({
      status: 'error',
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data provided',
      details: formattedIssues,
      timestamp,
    });
    return;
  }

  // 3. JSON body parsing error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      error: 'INVALID_JSON_BODY',
      message: 'Malformed JSON payload in request body',
      timestamp,
    });
    return;
  }

  // 4. SQLite Constraint Errors
  if (err && typeof err === 'object' && err.code) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({
        status: 'error',
        statusCode: 409,
        error: 'DUPLICATE_REFERENCE_ID',
        message: 'A transaction with this reference ID already exists for this account',
        timestamp,
      });
      return;
    }

    if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        error: 'CONSTRAINT_VIOLATION',
        message: 'Operation violates balance or amount integrity constraint (e.g. balance cannot be negative)',
        timestamp,
      });
      return;
    }
  }

  // 5. Default Unhandled Server Error
  console.error('Unhandled internal error:', err);
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred',
    timestamp,
  });
}
