import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';

// SEC-10: Email format validation helper
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SEC-11: Password must be at least 8 chars, contain an uppercase, lowercase, and a digit
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

// Valid user roles that can be registered via signup
const ALLOWED_ROLES = ['customer', 'driver', 'carrier'];

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // SEC-10: Validate email format even at login to reject malformed inputs early
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            // Use a generic error to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check account is active before comparing password (avoids bcrypt cost for suspended users)
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ userId: user.id, role: user.role });

        // SEC-AUDIT-6: Set JWT in an HTTP-only cookie for web clients.
        // - httpOnly: prevents JavaScript from reading the cookie (blocks XSS token theft)
        // - secure: only sent over HTTPS in production
        // - sameSite: 'strict' prevents CSRF attacks
        // - The token is ALSO returned in the JSON body for mobile clients (React Native SecureStore)
        res.cookie('cyvhub_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours, matching JWT expiry
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // SEC: Block public registration as admin roles
        if (role === 'admin' || !ALLOWED_ROLES.includes(role)) {
            return res.status(403).json({
                error: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
            });
        }

        // Required fields check
        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // SEC-10: Validate email format
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Invalid email address format' });
        }

        // SEC-11: Enforce minimum password strength
        if (password.length < PASSWORD_MIN_LENGTH) {
            return res.status(400).json({
                error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
            });
        }
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                error: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // Sanitise name fields — trim whitespace, reject empty strings
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst || !trimmedLast) {
            return res.status(400).json({ error: 'First and last name cannot be blank' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 12); // cost factor 12 for better security

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                firstName: trimmedFirst,
                lastName: trimmedLast,
                role,
            }
        });

        const token = generateToken({ userId: newUser.id, role: newUser.role });

        res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifySession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Also reject suspended sessions at verification time
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            return res.status(403).json({ error: 'Account suspended' });
        }

        res.json({
            message: 'Session valid',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Verify Session Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * SEC-AUDIT-6: Logout — clears the HTTP-only session cookie for web clients.
 * Mobile clients should delete their token from SecureStore on the client side.
 */
export const logout = (req: Request, res: Response) => {
    res.clearCookie('cyvhub_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.json({ message: 'Logged out successfully' });
};
