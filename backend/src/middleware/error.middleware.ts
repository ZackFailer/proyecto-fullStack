import { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  status?: number;
  code?: string | number;
  details?: unknown;
}

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as AppError;

  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: 'Recurso duplicado', code: 'DUPLICATE_KEY' });
  }

  if (error.status) {
    return res
      .status(error.status)
      .json({ success: false, message: error.message, code: error.code, details: error.details });
  }

  console.error('Unhandled error', error);
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
};
