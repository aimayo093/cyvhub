import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'CYVhub <noreply@cyvhub.com>';
const APP_URL = process.env.APP_URL || 'https://www.cyvhub.com';

/**
 * Sends a verification email to a newly registered user.
 * The link points to the frontend verify-email screen with the token as a query param.
 */
export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Verify your CYVhub account',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background:#0a2540;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">CYV<span style="color:#4f9cf9;">hub</span></h1>
                    <p style="color:#8ab4d8;margin:4px 0 0;font-size:13px;">Same Day B2B Courier Network</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 40px 32px;">
                    <h2 style="color:#0a2540;margin:0 0 16px;font-size:20px;">Welcome, ${firstName}!</h2>
                    <p style="color:#4a5568;margin:0 0 24px;line-height:1.6;">
                      Thanks for joining CYVhub. Please verify your email address to activate your account and get started.
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding:8px 0 32px;">
                          <a href="${verifyUrl}"
                             style="display:inline-block;background:#4f9cf9;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.2px;">
                            Verify My Email
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#718096;font-size:13px;margin:0 0 8px;line-height:1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color:#4f9cf9;font-size:12px;margin:0;word-break:break-all;">${verifyUrl}</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f7f9fc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                    <p style="color:#a0aec0;font-size:12px;margin:0;line-height:1.6;">
                      This link expires in 24 hours. If you did not create a CYVhub account, you can safely ignore this email.<br>
                      &copy; 2025 CYVhub — A brand of Cyvrix Limited
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
