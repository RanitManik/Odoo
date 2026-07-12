import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      details: err.issues,
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    stack: err.stack,
  });
};
