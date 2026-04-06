import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errorCode = err.code || 'INTERNAL_ERROR';

    // Log the error for admin diagnostics
    console.error(`[ErrorHandler] ${req.method} ${req.url} - Status: ${statusCode}, Code: ${errorCode}, Message: ${message}`);
    
    if (err.stack && process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Standardized error response
    res.status(statusCode).json({
        success: false,
        error: message,
        code: errorCode,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.url
    });
};
