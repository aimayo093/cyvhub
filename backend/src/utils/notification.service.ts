import axios from 'axios';
import { prisma } from '../index';
import * as EmailService from '../services/email.service';

export class NotificationService {
    /**
     * Retrieves the singleton NotificationSettings from DB.
     * Creates a default disabled config if it doesn't exist.
     */
    static async getSettings() {
        let settings = await prisma.notificationSettings.findFirst();
        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: {}
            });
        }
        return settings;
    }

    /**
     * Send an email using Resend (via EmailService).
     * Legacy SMTP settings are bypassed in favor of the established Resend integration.
     */
    static async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
        // We now prioritize Resend for all system emails. 
        // The NotificationSettings.emailEnabled flag still controls global output.
        const settings = await this.getSettings();
        
        if (!settings.emailEnabled && process.env.NODE_ENV === 'production') {
            console.log(`[NotificationService] Email disabled in settings. Skipped sending to ${to}`);
            return false;
        }

        try {
            // Note: Since we are migrating to structured templates in EmailService, 
            // this generic method acts as a fallback for simple text alerts.
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            
            await resend.emails.send({
                from: 'CYVhub <noreply@cyvhub.com>',
                to,
                subject,
                html: htmlBody,
            });

            console.log(`[NotificationService] Email sent successfully via Resend to ${to}`);
            await this.logNotification('EMAIL', to, subject, 'SUCCESS');
            return true;
        } catch (error: any) {
            console.error(`[NotificationService] Resend failed to send to ${to}:`, error.message);
            await this.logNotification('EMAIL', to, subject, 'FAILED', error.message);
            return false;
        }
    }

    /**
     * Specialized wrapper for booking confirmations.
     */
    static async sendBookingConfirmation(to: string, name: string, job: any) {
        try {
            await EmailService.sendBookingConfirmationEmail(to, name, job);
            await this.logNotification('EMAIL', to, `Booking Confirmed: ${job.jobNumber}`, 'SUCCESS');
            return true;
        } catch (error: any) {
            console.error(`[NotificationService] Failed to send booking confirmation to ${to}:`, error.message);
            await this.logNotification('EMAIL', to, `Booking Confirmed: ${job.jobNumber}`, 'FAILED', error.message);
            return false;
        }
    }

    /**
     * Send an SMS using Twilio REST API via Axios.
     */
    static async sendSms(to: string, message: string): Promise<boolean> {
        const settings = await this.getSettings();

        if (!settings.smsEnabled) {
            console.log(`[NotificationService] SMS disabled. Skipped sending to ${to}`);
            return false;
        }

        const sid = settings.twilioSid || process.env.TWILIO_ACCOUNT_SID;
        const token = settings.twilioToken || process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = settings.twilioFrom || process.env.TWILIO_PHONE_NUMBER;

        if (!sid || !token || !fromNumber) {
            console.error('[NotificationService] Twilio credentials missing.');
            await this.logNotification('SMS', to, undefined, 'FAILED', 'Missing Twilio credentials');
            return false;
        }

        try {
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
            const params = new URLSearchParams({
                To: to,
                From: fromNumber,
                Body: message,
            });

            const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

            await axios.post(twilioUrl, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': authHeader
                }
            });

            console.log(`[NotificationService] SMS sent successfully to ${to}`);
            await this.logNotification('SMS', to, undefined, 'SUCCESS');
            return true;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error(`[NotificationService] SMS failed to send to ${to}:`, errorMsg);
            await this.logNotification('SMS', to, undefined, 'FAILED', errorMsg);
            return false;
        }
    }

    /**
     * Log notification event to the database.
     */
    private static async logNotification(type: 'EMAIL' | 'SMS', recipient: string, subject: string | undefined, status: 'SUCCESS' | 'FAILED', errorMsg?: string) {
        try {
            await prisma.notificationLog.create({
                data: {
                    type,
                    recipient,
                    subject: subject || null,
                    message: subject ? 'Email body not logged' : 'SMS content',
                    status,
                    error: errorMsg || null,
                }
            });
        } catch (dbError) {
            console.error('[NotificationService] Failed to insert notification log', dbError);
        }
    }
}
