import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { sendVerificationEmail } from '../services/email.service';

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

        // Block unverified users before checking password (avoids bcrypt cost for unverified users)
        if (!user.emailVerified) {
            return res.status(403).json({
                error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
                code: 'EMAIL_NOT_VERIFIED',
            });
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

        const { phone } = req.body;
        const trimmedPhone = phone ? String(phone).trim() : '';
        if (!trimmedPhone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 12); // cost factor 12 for better security

        // Generate a secure email verification token (valid for 24 hours)
        const emailVerifyToken = crypto.randomUUID();
        const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                firstName: trimmedFirst,
                lastName: trimmedLast,
                role,
                phone: trimmedPhone,
                status: 'PENDING',
                emailVerified: false,
                emailVerifyToken,
                emailVerifyExpiry,
            }
        });

        // Send the verification email (non-blocking — don't let email failure break signup)
        try {
            await sendVerificationEmail(newUser.email, newUser.firstName, emailVerifyToken);
        } catch (emailError) {
            console.error('Verification email failed to send:', emailError);
            // Continue — user is created; they can request a resend later
        }

        res.status(201).json({
            message: 'Account created! Please check your email to verify your account before logging in.',
            email: newUser.email,
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Verifies a user's email using the token from the verification link.
 * GET /auth/verify-email?token=<uuid>
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification link' });
        }

        if (user.emailVerifyExpiry && user.emailVerifyExpiry < new Date()) {
            return res.status(400).json({
                error: 'Verification link has expired. Please sign up again.',
                code: 'TOKEN_EXPIRED',
            });
        }

        // Mark as verified, activate account, clear token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                status: 'ACTIVE',
                emailVerifyToken: null,
                emailVerifyExpiry: null,
            }
        });

        res.json({ message: 'Email verified successfully! You can now log in.' });

    } catch (error) {
        console.error('Verify Email Error:', error);
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
