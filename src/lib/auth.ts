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
    "http://localhost:3000",
    "http://localhost:5000",
    process.env.APP_URL!,
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
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email — GreenRoots</title></head>
    <body style="margin:0;padding:0;background-color:#f5f2eb;font-family:Georgia,serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#fefcf7;border-radius:4px;overflow:hidden;border:1px solid #d8c99a;">

            <!-- Header -->
            <tr>
              <td style="background:#152010;padding:36px 40px 30px;text-align:center;">
                <!-- Leaf SVG icon -->
                <div style="margin:0 auto 12px;width:36px;height:40px;">
                  <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 39C18 39 3 27 3 16C3 7.716 9.716 1 18 1C26.284 1 33 7.716 33 16C33 27 18 39 18 39Z"
                          fill="rgba(50,110,35,0.5)" stroke="rgba(100,180,60,0.6)" stroke-width="1.2"/>
                    <line x1="18" y1="6" x2="18" y2="37" stroke="rgba(140,220,90,0.5)" stroke-width="0.9"/>
                    <line x1="18" y1="14" x2="12" y2="20" stroke="rgba(140,220,90,0.4)" stroke-width="0.7"/>
                    <line x1="18" y1="20" x2="24" y2="26" stroke="rgba(140,220,90,0.4)" stroke-width="0.7"/>
                  </svg>
                </div>
                <span style="font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#d4c4a0;letter-spacing:2px;">GreenRoots</span>
                <p style="color:rgba(175,148,82,0.65);font-size:10px;margin:6px 0 0;letter-spacing:3px;font-family:'Courier New',monospace;text-transform:uppercase;">Rooted in Nature &middot; Delivered to You</p>
              </td>
            </tr>

            <!-- Accent bar — amber gradient -->
            <tr><td style="height:3px;background:linear-gradient(90deg,#8a5a2a,#c8a45a,#8a5a2a);font-size:0;">&nbsp;</td></tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 44px 32px;">
                <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#1a2e10;margin:0 0 10px;letter-spacing:0.5px;">Verify your email address</h1>
                <p style="font-size:14px;color:#4a6040;margin:0 0 28px;line-height:1.7;">Hi ${user.name ?? "there"}, welcome to GreenRoots. Please confirm your email address to activate your account and explore our herbal &amp; organic wellness collection.</p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:28px 0;">
                    <a href="${verificationUrl}" style="display:inline-block;background:#152010;color:#d4c4a0;text-decoration:none;font-family:'Courier New',monospace;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:14px 40px;border-radius:2px;border:1px solid rgba(175,148,82,0.4);">Verify Email Address</a>
                  </td></tr>
                </table>

                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #d8c99a;padding:0;font-size:0;">&nbsp;</td></tr></table>

                <!-- Fallback link -->
                <p style="font-size:12px;color:#7a8a6a;line-height:1.7;margin:20px 0 6px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size:11px;color:#4a6040;font-family:'Courier New',monospace;word-break:break-all;margin:0;background:#eef2e8;padding:10px 12px;border-radius:2px;border-left:3px solid #7ec85a;">${verificationUrl}</p>

                <!-- Expiry notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#faeeda;border-radius:2px;border-left:3px solid #c8a45a;padding:12px 14px;">
                      <p style="font-size:12px;color:#633806;margin:0;line-height:1.6;">&#9200; This link expires in <strong>24 hours</strong>. If you didn't create a GreenRoots account, you can safely ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f0ede4;border-top:1px solid #d8c99a;padding:20px 44px;text-align:center;">
                <p style="font-size:11px;color:#8a7a5a;margin:0;line-height:1.8;font-family:'Courier New',monospace;letter-spacing:0.5px;">
                  GreenRoots &middot; support@greenroots.app<br/>
                  You're receiving this because you registered at greenroots.app
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

        const info = await transporter.sendMail({
          from: '"GreenRoots" <noreply@greenroots.app>',
          to: user.email,
          subject: "Verify your GreenRoots email address",
          text: `Hi ${user.name ?? "there"},\n\nPlease verify your email by visiting:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\n— GreenRoots`,
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
      redirectURI: process.env.GOOGLE_REDIRECT_URI,
    },
  },
});