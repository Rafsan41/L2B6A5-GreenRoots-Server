import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import nodemailer from "nodemailer"

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.APP_USER_EMAIL,
    pass: process.env.APP_USER_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  baseURL: process.env.APP_URL,           // http://localhost:5000 — where better-auth runs
  trustedOrigins: [
    "http://localhost:3000",               // Next.js frontend
    process.env.APP_URL!,                  // Express server itself
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false
      },
      image: {
        type: "string",
        required: false
      },
      phones: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Default role to CUSTOMER for Google OAuth (no role passed)
          const role = (user as any).role ?? "CUSTOMER"
          // Sellers must wait for admin approval
          const status = role === "SELLER" ? "PENDING" : "ACTIVE"
          return { data: { ...user, role, status } }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email</title></head>
    <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d1dce8;">
    
            <!-- Header -->
            <tr>
              <td style="background:#0a5c4a;padding:32px 40px 28px;text-align:center;">
                <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 auto 4px;">
                  <tr>
                    <td style="padding-right:10px;vertical-align:middle;">
                      <table cellpadding="0" cellspacing="0" style="background:#1d9e75;border-radius:6px;width:28px;height:28px;">
                        <tr><td align="center" style="font-size:18px;color:#fff;line-height:28px;">✚</td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">MediStore</span>
                    </td>
                  </tr>
                </table>
                <p style="color:#9fe1cb;font-size:11px;margin:4px 0 0;letter-spacing:1.5px;font-family:'Courier New',monospace;text-transform:uppercase;">Your trusted pharmacy partner</p>
              </td>
            </tr>
    
            <!-- Accent bar -->
            <tr><td style="height:4px;background:#1d9e75;font-size:0;">&nbsp;</td></tr>
    
            <!-- Body -->
            <tr>
              <td style="padding:40px 40px 32px;">
                <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#0a3d2e;margin:0 0 8px;">Verify your email address</h1>
                <p style="font-size:14px;color:#5a7a6f;margin:0 0 28px;line-height:1.6;">Hi ${user.name ?? "there"}, welcome to MediStore. Please confirm your email address to activate your account and start managing your health orders.</p>
    
                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:32px 0;">
                    <a href="${verificationUrl}" style="display:inline-block;background:#0a5c4a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;padding:14px 40px;border-radius:6px;">Verify Email Address</a>
                  </td></tr>
                </table>
    
                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #d1ece4;padding:0;font-size:0;">&nbsp;</td></tr></table>
    
                <!-- Fallback link -->
                <p style="font-size:12px;color:#7a9e94;line-height:1.7;margin:20px 0 6px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size:12px;color:#0f6e56;font-family:'Courier New',monospace;word-break:break-all;margin:0;background:#e1f5ee;padding:10px 12px;border-radius:4px;border-left:3px solid #1d9e75;">${verificationUrl}</p>
    
                <!-- Expiry notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#faeeda;border-radius:6px;border-left:3px solid #ef9f27;padding:12px 14px;">
                      <p style="font-size:12px;color:#633806;margin:0;line-height:1.6;">⏱ This link expires in <strong>24 hours</strong>. If you didn't create a MediStore account, you can safely ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
    
            <!-- Footer -->
            <tr>
              <td style="background:#f5faf8;border-top:1px solid #d1ece4;padding:20px 40px;text-align:center;">
                <p style="font-size:11px;color:#8aada4;margin:0;line-height:1.8;">
                  MediStore Health Technologies &middot; support@medistore.app<br/>
                  You're receiving this because you registered at medistore.app
                </p>
              </td>
            </tr>
    
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

        const info = await transporter.sendMail({
          from: '"MediStore" <noreply@medistore.app>',
          to: user.email,
          subject: "Verify your MediStore email address",
          text: `Hi ${user.name ?? "there"},\n\nPlease verify your email by visiting:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\n— MediStore`,
          html: emailHtml,
        });

        console.log("Verification email sent:", info.messageId);
      } catch (err) {
        console.error("Error sending verification email:", err);
      }
    }
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});