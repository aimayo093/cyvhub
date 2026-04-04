import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import jobRoutes from './routes/job.routes';
import paymentRoutes from './routes/payment.routes';
import deliveryRoutes from './routes/delivery.routes';
import businessRoutes from './routes/business.routes';
import contractRoutes from './routes/contract.routes';
import quoteRoutes from './routes/quote.routes';
import carrierRoutes from './routes/carrier.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import invoiceRoutes from './routes/invoice.routes';
import activityRoutes from './routes/activity.routes';
import stripeRoutes from './routes/stripe.routes';
import checkoutRoutes from './routes/checkout.routes';
import mediaRoutes from './routes/media.routes';
import settingsRoutes from './routes/settings.routes';
import locationRoutes from './routes/location.routes';
import hrRoutes from './routes/hr.routes';
import payrollRoutes from './routes/payroll.routes';
import cronRoutes from './routes/cron.routes';
import cmsRoutes from './routes/cms.routes';
import adminRoutes from './routes/admin.routes';
import accountingRoutes from './routes/accounting.routes';
import commercialRoutes from './routes/commercial.routes';
import adminCommercialRoutes from './routes/admin.commercial.routes';
import complianceRoutes from './routes/compliance.routes';
import paypalRoutes from './routes/paypal.routes';

dotenv.config();

// SEC-3: Refuse to start if critical environment variables are missing.
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
];

REQUIRED_ENV_VARS.forEach(key => {
    if (!process.env[key]) {
        console.error(`❌ FATAL: Missing required environment variable: ${key}`);
        // During Vercel build, we don't want to kill the process, but we warn loudly.
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }
});

const app: Express = express();
const PORT = process.env.PORT || 3000;

// SEC-AUDIT-6: Trust Vercel's reverse proxy headers for correct IP detection
// (required for express-rate-limit to work correctly on Vercel)
app.set('trust proxy', 1);

// Singleton PrismaClient — datasources override forces pgbouncer-compatible mode
// (disables prepared statements which don't work with PgBouncer's transaction pooling)
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// SEC-1: Explicit allowlist — no wildcard in production.
// Set ALLOWED_ORIGINS in your environment (comma-separated).
// ─────────────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:8081', 'http://10.0.2.2:3000'];

// ─────────────────────────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server requests (no origin)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.endsWith('cyvhub.com') || 
                         (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: Origin '${origin}' not allowed.`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiters
// ─────────────────────────────────────────────────────────────────────────────

// SEC-4: Brute-force protection on auth endpoints (20 req / 15 min / IP)
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in 15 minutes.' },
});

// SEC-AUDIT-5: Global defence-in-depth limiter — 500 req / 15 min / IP
const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP. Please try again later.' },
});

// SEC-INPUT: Tight limiter for the AI assistant — 10 req / min / IP
// AI queries are expensive; this blocks cost abuse while allowing real users.
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests. Please wait a moment before trying again.' },
});

// Location updates can be frequent from drivers (every ~5–10 s) — 60 req / min / IP
const locationRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Location update rate limit exceeded.' },
});

// Apply global limiter to all /api routes
app.use('/api', globalRateLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Body Parsers
// STRIPE WEBHOOK must be mounted BEFORE express.json() — needs the raw body.
// All other Stripe routes (e.g. create-payment-intent) need parsed JSON,
// so they are mounted AFTER express.json() below.
// ─────────────────────────────────────────────────────────────────────────────
import stripeWebhookRouter from 'express';
const webhookOnlyRouter = stripeWebhookRouter.Router();
webhookOnlyRouter.post('/webhook', stripeWebhookRouter.raw({ type: 'application/json' }), require('./controllers/stripe.controller').StripeController.handleWebhook);
app.use('/api/stripe', webhookOnlyRouter);

// SEC-AUDIT-5: Hard limit body to 100kb to block large-payload DoS attacks.
app.use(express.json({ limit: '100kb' }));

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
console.log('🛠 Starting Route Registration...');

// Public routes (with rate limiting)
app.use('/api/auth', authRateLimiter, authRoutes);          // SEC-4: Auth brute-force protection

// Stripe API routes (NOT webhook) — mounted after express.json() so req.body is parsed
app.use('/api/stripe', stripeRoutes);
app.use('/api/checkout', checkoutRoutes);

// Protected routes — all require JWT authentication (enforced per-router)
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/carriers', carrierRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);

// Location — dedicated rate limiter to allow frequent driver GPS updates
app.use('/api/location', locationRateLimiter, locationRoutes);

// HR & Payroll
app.use('/api/hr', hrRoutes);
app.use('/api/payroll', payrollRoutes);

// Automated Jobs
app.use('/api/cron', cronRoutes);

// Admin CMS & Oversight Dashboard
// NOTE: mounted at /api/cms (not /api/cms/pages) so routes like
// GET  /api/cms/config/:key  and  POST /api/cms/config  resolve correctly.
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/commercial', adminCommercialRoutes);

// External Integrations
app.use('/api/accounting', accountingRoutes);
app.use('/api/paypal', paypalRoutes);

// Commercial Pricing & Rules Engine
app.use('/api/commercial', commercialRoutes);

// Driver Compliance (upload, status, admin verification)
app.use('/api/compliance', complianceRoutes);

console.log('✅ All routes registered.');

// ─────────────────────────────────────────────────────────────────────────────
// Health / Root
// ─────────────────────────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
    res.send(`
        <html>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
                <h1 style="color: #3b82f6;">🚀 CYVhub API is Live</h1>
                <p>The backend services are running correctly.</p>
                <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <code style="color: #60a5fa;">Health Check: <a href="/health" style="color: #fbbf24;">/health</a></code>
                </div>
            </body>
        </html>
    `);
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'CYVhub API is running on Vercel + Supabase.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Server Bootstrap
// Vercel invokes the function by importing the `app` export.
// When running locally with ts-node-dev the listen() call starts a normal server.
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 CYVhub API running locally on port ${PORT}`);
    });
}

export default app;
