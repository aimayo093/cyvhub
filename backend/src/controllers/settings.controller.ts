import { Request, Response } from 'express';
import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';

export class SettingsController {
    /**
     * Get current notification settings
     */
    static async getSettings(req: Request, res: Response) {
        try {
            const settings = await NotificationService.getSettings();
            
            // Mask sensitive tokens before sending to the client
            const maskedSettings = {
                ...settings,
                smtpPass: settings.smtpPass ? '********' : null,
                twilioToken: settings.twilioToken ? '********' : null,
            };

            res.json(maskedSettings);
        } catch (error: any) {
            console.error('[SettingsController] Failed to get settings:', error);
            res.status(500).json({ error: 'Failed to retrieve settings' });
        }
    }

    /**
     * Update notification settings. Admin only.
     */
    static async updateSettings(req: Request, res: Response) {
        try {
            const updates = req.body;
            
            // Don't update passwords if they are the masked '********' string
            if (updates.smtpPass === '********') {
                delete updates.smtpPass;
            }
            if (updates.twilioToken === '********') {
                delete updates.twilioToken;
            }

            // Remove id and updatedAt if present
            delete updates.id;
            delete updates.updatedAt;

            const currentSettings = await NotificationService.getSettings();

            const updatedSettings = await prisma.notificationSettings.update({
                where: { id: currentSettings.id },
                data: updates,
            });

            // Mask before returning
            const maskedSettings = {
                ...updatedSettings,
                smtpPass: updatedSettings.smtpPass ? '********' : null,
                twilioToken: updatedSettings.twilioToken ? '********' : null,
            };

            res.json(maskedSettings);
        } catch (error: any) {
            console.error('[SettingsController] Failed to update settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }

    /**
     * Send a test email
     */
    static async testEmail(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email address is required' });
            }

            const success = await NotificationService.sendEmail(
                email,
                'CYVhub Test Configuration',
                '<h2>Test Email</h2><p>Your CYVhub email configuration is working correctly.</p>'
            );

            if (success) {
                res.json({ message: 'Test email sent successfully' });
            } else {
                res.status(500).json({ error: 'Failed to send test email. Check server logs.' });
            }
        } catch (error: any) {
            console.error('[SettingsController] Test email error:', error);
            res.status(500).json({ error: 'Failed to execute test email' });
        }
    }

    /**
     * Send a test SMS
     */
    static async testSms(req: Request, res: Response) {
        try {
            const { phone } = req.body;
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }

            const success = await NotificationService.sendSms(
                phone,
                'CYVhub: Your SMS configuration is working correctly.'
            );

            if (success) {
                res.json({ message: 'Test SMS sent successfully' });
            } else {
                res.status(500).json({ error: 'Failed to send test SMS. Check server logs.' });
            }
        } catch (error: any) {
            console.error('[SettingsController] Test SMS error:', error);
            res.status(500).json({ error: 'Failed to execute test SMS' });
        }
    }

    /**
     * Handle notification logs fetch
     */
     static async getLogs(req: Request, res: Response) {
        try {
            const logs = await prisma.notificationLog.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
            });
            res.json(logs);
        } catch (error: any) {
            console.error('[SettingsController] Failed to get logs:', error);
            res.status(500).json({ error: 'Failed to retrieve notification logs' });
        }
    }
}
