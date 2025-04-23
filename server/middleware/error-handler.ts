
import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

/**
 * Global error handler middleware
 * Catches all uncaught exceptions in the request processing pipeline
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine if this is a client error (4xx) or server error (5xx)
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Create detailed error context
  const errorContext = {
    path: req.path,
    method: req.method,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    name: err.name,
    message: err.message,
    stack: err.stack
  };
  
  // Log the error with full context
  logError(
    `Request error: ${err.message}`,
    'ErrorHandler',
    errorContext
  );
  
  // Respond with appropriate error format
  // In production, you may want to sanitize error details
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request'
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!res.headersSent) {
    const notFoundError = new Error(`Not Found - ${req.originalUrl}`);
    logError(
      `Resource not found: ${req.originalUrl}`,
      'NotFoundHandler',
      {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    res.status(404);
    next(notFoundError);
  }
};
