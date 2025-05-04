import { Request, Response, NextFunction } from "express";

/**
 * Centralized error handling middleware
 * Catches errors passed via next(err) or thrown in async handlers
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("-------------------- ERROR --------------------");
  console.error(`[${new Date().toISOString()}] Error occurred on ${req.method} ${req.path}`);
  // Log the error stack or details for debugging
  // Avoid logging sensitive details in production logs if applicable
  console.error(err.stack || err);
  console.error("---------------------------------------------");

  // Check if the response headers have already been sent
  if (res.headersSent) {
    // If headers are sent, delegate to the default Express error handler
    // This usually means the error happened *while* streaming the response
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Avoid sending detailed error messages or stack traces to the client in production
  res.status(statusCode).json({ error: message });
};
