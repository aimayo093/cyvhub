import 'dotenv/config';
import jwt from 'jsonwebtoken';

// SEC-3: JWT_SECRET must be set — validated at startup in index.ts.
// We cast here safely because index.ts already calls process.exit(1) if missing.
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
    userId: string;
    role: string;
}

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};
