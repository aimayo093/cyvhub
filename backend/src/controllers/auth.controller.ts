import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../index';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

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
        console.log(`[AUTH_DEBUG] Attempting login for: ${email}`);

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Email and password are required and must be strings', code: 'MISSING_FIELDS' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        
        if (!user) {
            console.warn(`[AUTH_DEBUG] User not found: ${normalizedEmail}`);
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        console.log(`[AUTH_DEBUG] User record found: id=${user.id}, role=${user.role}, verified=${user.emailVerified}, status=${user.status}`);

        // Block unverified users before checking password
        if (!user.emailVerified) {
            console.warn(`[AUTH_DEBUG] Login blocked: Email not verified for ${normalizedEmail}`);
            return res.status(403).json({
                error: 'Please verify your email address before logging in.',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }

        // Check account is active
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            console.warn(`[AUTH_DEBUG] Login blocked: Account status ${user.status} for ${normalizedEmail}`);
            return res.status(403).json({ 
                error: `Your account is ${user.status.toLowerCase()}. Please contact support.`,
                code: 'ACCOUNT_DISCONTINUED'
            });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            console.warn(`[AUTH_DEBUG] Password mismatch for ${normalizedEmail}`);
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        const token = generateToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

        // SEC-AUDIT-6: Set JWT in an HTTP-only cookie for web clients.
        res.cookie('cyvhub_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, 
        });

        res.cookie('cyvhub_refresh_session', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        console.log(`[AUTH_DEBUG] Login success: ${normalizedEmail} (Role: ${user.role})`);

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

        if (typeof email !== 'string' || typeof password !== 'string' || typeof firstName !== 'string' || typeof lastName !== 'string' || typeof role !== 'string') {
            return res.status(400).json({ error: 'Invalid input format' });
        }

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
 * SEC-AUDIT-6: Logout — clears the HTTP-only session cookies for web clients.
 * Mobile clients should delete their token from SecureStore on the client side.
 */
export const logout = (req: Request, res: Response) => {
    res.clearCookie('cyvhub_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.clearCookie('cyvhub_refresh_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.json({ message: 'Logged out successfully' });
};

/**
 * POST /auth/refresh
 * Refreshes an expired access token using the HTTP-only refresh token cookie.
 */
export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.cyvhub_refresh_session;
        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token provided', code: 'NO_REFRESH_TOKEN' });
        }

        const decoded = verifyToken(refreshToken);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user || user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
            return res.status(403).json({ error: 'Account suspended or inactive' });
        }

        const newToken = generateToken({ userId: user.id, role: user.role });

        res.cookie('cyvhub_session', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });

        res.json({ message: 'Token refreshed', token: newToken });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /auth/forgot-password
 * Generates a password reset token and emails it to the user.
 * Always returns 200 to prevent account enumeration attacks.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

        // Always return success — don't reveal whether the email exists
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate a secure random token valid for 1 hour
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: token,
                passwordResetExpiry: expiry,
            },
        });

        await sendPasswordResetEmail(user.email, user.firstName, token);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /auth/reset-password
 * Validates the token and updates the user's password.
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 8 || !PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number',
            });
        }

        const user = await prisma.user.findFirst({
            where: { passwordResetToken: token },
        });

        if (!user || !user.passwordResetExpiry) {
            return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
        }

        if (new Date() > user.passwordResetExpiry) {
            return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
        }

        const newHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });

        res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

