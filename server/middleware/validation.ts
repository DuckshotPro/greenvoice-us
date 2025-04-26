import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logWarning } from "../utils/logger";

/**
 * Creates a middleware function that validates request body against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log the validation error
        logWarning(
          `Body validation failed for ${req.path}`,
          'ValidationMiddleware',
          {
            path: req.path,
            method: req.method,
            errors: error.errors,
            body: req.body
          }
        );
        
        // Return a structured error response
        return res.status(400).json({
          message: 'Invalid request body',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Creates a middleware function that validates request query parameters against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log the validation error
        logWarning(
          `Query validation failed for ${req.path}`,
          'ValidationMiddleware',
          {
            path: req.path,
            method: req.method,
            errors: error.errors,
            query: req.query
          }
        );
        
        // Return a structured error response
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Creates a middleware function that validates request parameters against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log the validation error
        logWarning(
          `Path parameter validation failed for ${req.path}`,
          'ValidationMiddleware',
          {
            path: req.path,
            method: req.method,
            errors: error.errors,
            params: req.params
          }
        );
        
        // Return a structured error response
        return res.status(400).json({
          message: 'Invalid path parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};