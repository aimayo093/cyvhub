import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getConnectionStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;

        // Ensure we are working with a carrier
        if (role !== 'carrier') {
            return res.status(403).json({ error: 'Only carriers can connect accounting integrations.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { carrierProfile: true }
        });

        if (!user || !user.carrierProfile) {
            return res.status(404).json({ error: 'Carrier profile not found.' });
        }

        const integration = await (prisma as any).accountingIntegration.findUnique({
            where: { carrierId: user.carrierProfile.id }
        });

        if (!integration) {
            return res.json({ connected: false });
        }

        res.json({
            connected: true,
            provider: integration.provider,
            expiresAt: integration.expiresAt
        });
    } catch (error) {
        console.error('Get Accounting Status Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const connectProvider = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { provider } = req.params; // xero, sage, freeagent
        // In a real OAuth flow we'd construct a redirect URI using our client id
        const fakeOAuthUrl = `https://login.${provider}.com/oauth2/authorize?client_id=MOCK&redirect_uri=MOCK`;
        
        res.json({ url: fakeOAuthUrl });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const oauthCallbackMock = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { provider, code } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { carrierProfile: true }
        });

        if (!user || !user.carrierProfile) return res.status(404).json({ error: 'Carrier not found.' });

        // MOCK: Exchange OAuth code for actual tokens
        const mockAccessToken = `eyJhbG...${Date.now()}`;
        const mockRefreshToken = `REFRESH...${Date.now()}`;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await (prisma as any).accountingIntegration.upsert({
            where: { carrierId: user.carrierProfile.id },
            create: {
                carrierId: user.carrierProfile.id,
                provider: provider.toUpperCase(),
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                expiresAt
            },
            update: {
                provider: provider.toUpperCase(),
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                expiresAt
            }
        });

        res.json({ success: true, message: `Successfully connected to ${provider.toUpperCase()}` });
    } catch (error) {
        console.error('Accounting Callback Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const disconnectProvider = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { carrierProfile: true }
        });

        if (!user || !user.carrierProfile) return res.status(404).json({ error: 'Carrier not found.' });

        await (prisma as any).accountingIntegration.delete({
            where: { carrierId: user.carrierProfile.id }
        });

        res.json({ success: true, message: 'Accounting integration disconnected.' });
    } catch (error) {
        console.error('Disconnect Provider Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
