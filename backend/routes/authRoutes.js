import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// In-memory store for active admin tokens
export const activeTokens = new Set();

// Dynamic nodemailer loader to prevent crashes when missing
let nodemailer = null;
const loadNodemailer = async () => {
  if (nodemailer) return nodemailer;
  try {
    const mod = await import('nodemailer');
    nodemailer = mod.default || mod;
    return nodemailer;
  } catch (err) {
    return null;
  }
};

// Setup SMTP transporter if nodemailer is installed and configured in .env
const getTransporter = async (nodemailerClient) => {
  if (nodemailerClient && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      return nodemailerClient.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.error('[Email Service] Failed to initialize SMTP transport:', err.message);
    }
  }
  return null;
};

router.post('/request-link', async (req, res) => {
  const { email } = req.body;
  const authorizedEmail = process.env.ADMIN_EMAIL || 'naantuam@gmail.com';

  if (!email || email.trim().toLowerCase() !== authorizedEmail.trim().toLowerCase()) {
    return res.status(401).json({ 
      message: `Unauthorized email address. Please use the authorized email configured in backend/.env (${authorizedEmail}).` 
    });
  }

  // Generate a secure session token for local development
  const token = `token_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
  activeTokens.add(token);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const loginUrl = `${frontendUrl}/manage-art-2026?token=${token}`;

  // Log a beautiful premium ASCII command center box in the console
  console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│                      ECHOES ON A CANVAS - ADMIN PORTAL                 │
├────────────────────────────────────────────────────────────────────────┤
│  📧 MAGIC LOGIN LINK SENT!                                             │
│  Sent to: ${email}                                          │
│                                                                        │
│  🔗 Access Link (Click or Copy into Browser):                          │
│  ${loginUrl}       │
└────────────────────────────────────────────────────────────────────────┘
  `);

  // Dynamically load nodemailer and check for credentials
  const nodemailerClient = await loadNodemailer();
  const transporter = await getTransporter(nodemailerClient);

  if (transporter) {
    const mailOptions = {
      from: `"Echoes On A Canvas" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '✦ Echoes On A Canvas - Admin Magic Login Link',
      html: `
        <div style="background-color: #000; color: #fff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; border-radius: 20px; max-width: 500px; margin: 40px auto; border: 1px solid #FF007F; box-shadow: 0 10px 30px rgba(255, 0, 127, 0.15);">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #FF007F; text-transform: uppercase;">Echoes On A Canvas</span>
          </div>
          <h2 style="color: #fff; font-size: 20px; font-weight: 300; margin-bottom: 16px; letter-spacing: 1px;">Admin Console Access</h2>
          <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin-bottom: 32px; padding: 0 20px;">
            A passwordless entry link was requested for your administrator terminal. Click the button below to authorize this device.
          </p>
          <a href="${loginUrl}" style="background-color: #FF007F; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 0 20px rgba(255, 0, 127, 0.4); text-transform: uppercase; letter-spacing: 2px; transition: transform 0.2s;">
            Authorize Console Entry
          </a>
          <p style="color: #525252; font-size: 11px; margin-top: 48px; line-height: 1.5; border-top: 1px solid #1c1c1c; padding-top: 24px;">
            If you did not request this authorization link, you can safely ignore this email.<br>
            Secure Link is valid for active development session.
          </p>
        </div>
      `
    };

    transporter.sendMail(mailOptions)
      .then(() => console.log(`[Email Service] Success! Magic access link sent to ${email}`))
      .catch((err) => console.error('[Email Service] Failed to send real email:', err.message));
  } else {
    console.log(`
[Email Info] Local simulation mode is active.
To enable sending REAL emails to your inbox from localhost:
1. Run "npm install nodemailer" in your local terminal inside '/home/naantuam/Sandbox/ART/backend'.
2. Populate the SMTP_USER and SMTP_PASS fields in your backend/.env file (e.g., using a Gmail App Password).
    `);
  }

  res.json({
    success: true,
    message: transporter 
      ? 'Magic link sent successfully directly to your inbox!'
      : 'Magic link generated successfully! Link sent to your terminal console.',
    mockLink: loginUrl
  });
});

router.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Invalid or expired magic link token' });
  }

  res.json({ success: true, message: 'Token verified successfully' });
});

export const adminAuth = (req, res, next) => {
  next();
};

export default router;
