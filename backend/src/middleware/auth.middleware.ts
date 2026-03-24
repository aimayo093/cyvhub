import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // SEC-AUDIT-6: Support both Bearer token (mobile) and HTTP-only cookie (web).
    // Mobile clients: send `Authorization: Bearer <token>` header.
    // Web clients: token is in the `cyvhub_session` HTTP-only cookie set by the server at login.
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies?.cyvhub_session) {
        token = req.cookies.cyvhub_session;
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = payload;
    next();
};

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
