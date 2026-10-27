import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      // In Express 5 req.query has only a getter, so we mutate existing properties
      if (req.query && typeof req.query === 'object') {
        Object.keys(req.query).forEach((key) => delete (req.query as any)[key]);
        Object.assign(req.query, parsed);
      }
      (req as any).validatedQuery = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      if (req.params && typeof req.params === 'object') {
        Object.assign(req.params, parsed);
      }
      (req as any).validatedParams = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
