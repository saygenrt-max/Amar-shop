import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Real Email Dispatcher via Nodemailer (Gmail SMTP / Custom SMTP / Resend)
async function sendRealEmailOtp(toEmail: string, code: string, purpose: 'register' | 'forgot_password'): Promise<{
  delivered: boolean;
  method?: string;
  reason?: string;
  error?: string;
  messageId?: string;
}> {
  const isRegister = purpose === 'register';
  const subject = isRegister
    ? `AmarShop - আপনার অ্যাকাউন্ট ভেরিফিকেশন কোড: ${code}`
    : `AmarShop - পাসওয়ার্ড পরিবর্তন ভেরিফিকেশন কোড: ${code}`;

  const purposeTitle = isRegister ? 'অ্যাকাউন্ট ভেরিফিকেশন' : 'পাসওয়ার্ড পরিবর্তন রিকোয়েস্ট';
  const purposeDesc = isRegister
    ? 'AmarShop-এ আপনার নতুন অ্যাকাউন্ট তৈরি নিশ্চিত করতে নিচের ৪ সংখ্যার ভেরিফিকেশন কোডটি ব্যবহার করুন।'
    : 'আপনার AmarShop একাউন্টের পাসওয়ার্ড পরিবর্তন / রিসেট করতে নিচের ৪ সংখ্যার ভেরিফিকেশন কোডটি ব্যবহার করুন।';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">AmarShop 🛍️</h1>
          <p style="margin: 6px 0 0; color: #d1fae5; font-size: 14px; font-weight: 500;">বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম</p>
        </div>

        <!-- Main Body -->
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a; font-weight: 700;">${purposeTitle}</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
            ${purposeDesc}
          </p>

          <!-- 4-Digit Code Box -->
          <div style="background: #f8fafc; border: 2px dashed #059669; border-radius: 14px; padding: 28px 16px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
              আপনার ৪ সংখ্যার ওটিপি কোড (OTP)
            </div>
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 14px; color: #047857; font-family: monospace; line-height: 1; padding-left: 14px;">
              ${code}
            </div>
            <div style="margin-top: 14px; font-size: 13px; color: #64748b;">
              ⏱️ এই কোডটি আগামী <strong>১০ মিনিট</strong> পর্যন্ত কার্যকর থাকবে।
            </div>
          </div>

          <!-- Instructions -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
              📌 এই কোডটি কপি করে AmarShop সাইটে ভেরিফিকেশন বক্সে পেস্ট করুন।
            </p>
          </div>

          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
            🔒 নিরাপত্তা সতর্কতা: এই কোডটি কাউকে জানাবেন না। AmarShop কর্তৃপক্ষ কখনোই গ্রাহকের ওটিপি বা পাসওয়ার্ড জানতে চায় না।
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 6px;">AmarShop Bangladesh &bull; সর্বস্বত্ব সংরক্ষিত</p>
          <p style="margin: 0;">যদি আপনি এই কোডের অনুরোধ না করে থাকেন, তবে এই মেইলটি নিরাপদে মুছে ফেলতে পারেন।</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Option 1: Gmail SMTP or Custom SMTP via Nodemailer
  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const isCustomSmtp = Boolean(process.env.SMTP_HOST);
      const transportConfig: any = isCustomSmtp
        ? {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
            secure: process.env.SMTP_PORT === '465',
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
          }
        : {
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass },
          };

      const transporter = nodemailer.createTransport(transportConfig);

      const sendInfo = await transporter.sendMail({
        from: `"AmarShop" <${smtpUser}>`,
        to: toEmail,
        subject,
        html: htmlBody,
      });

      console.log(`[AmarShop Mailer] ✅ Email sent to ${toEmail} | MessageId: ${sendInfo.messageId}`);
      return { delivered: true, method: isCustomSmtp ? 'custom_smtp' : 'gmail_smtp', messageId: sendInfo.messageId };
    } catch (err: any) {
      console.error(`[AmarShop Mailer] ❌ SMTP delivery error to ${toEmail}:`, err.message);
      return { delivered: false, error: err.message, reason: 'smtp_error' };
    }
  }

  // Option 2: Resend API (if configured)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AmarShop <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlBody,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[AmarShop Mailer] ✅ Sent via Resend to ${toEmail}`);
        return { delivered: true, method: 'resend', messageId: (data as any)?.id };
      } else {
        console.error(`[AmarShop Mailer] ❌ Resend API error:`, data);
        return { delivered: false, error: JSON.stringify(data), reason: 'resend_error' };
      }
    } catch (err: any) {
      console.error(`[AmarShop Mailer] ❌ Resend exception:`, err.message);
      return { delivered: false, error: err.message, reason: 'resend_exception' };
    }
  }

  // If no credentials configured yet:
  console.log(`[AmarShop Mailer] ℹ️ Real email credentials not yet set in environment. Simulated code for testing: [${code}] for [${toEmail}]`);
  return {
    delivered: false,
    reason: 'no_smtp_configured',
    note: 'Please configure GMAIL_USER and GMAIL_APP_PASSWORD in Settings > Secrets to deliver real emails to inboxes.',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Email 4-Digit OTP Dispatch API (audit logging & real delivery to Gmail)
  app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
      const { email, code, purpose } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
      }

      console.log(`[AmarShop Email Service] ✉️ 4-Digit Verification Code: [${code}] dispatching to: ${email} for action: ${purpose}`);
      const sendResult = await sendRealEmailOtp(email, code, purpose || 'register');

      res.json({ 
        success: true, 
        delivered: sendResult.delivered,
        method: sendResult.method || null,
        reason: sendResult.reason || null,
        error: sendResult.error || null,
        email,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[AmarShop Email Service] Handler error:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Gemini AI Customer Support Chatbot
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, language = 'bn', history = [] } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // High quality fallback responses if API key is not yet set
        const lower = message.toLowerCase();
        let fallbackReply = '';
        if (language === 'bn') {
          if (lower.includes('ডেলিভারি') || lower.includes('সময়')) {
            fallbackReply = 'আমাদের স্ট্যান্ডার্ড ডেলিভারি ২-৩ কার্যদিবস এবং এক্সপ্রেস ডেলিভারি ১২-২৪ ঘণ্টার মধ্যে পৌঁছে যায়। ঢাকা সিটির মধ্যে ক্যাশ অন ডেলিভারি এবং দ্রুততম সময়ে পণ্য পৌঁছানোর নিশ্চয়তা দিচ্ছি।';
          } else if (lower.includes('পেমেন্ট') || lower.includes('টাকা') || lower.includes('বিকাশ')) {
            fallbackReply = 'আমরা বিকাশ (bKash), নগদ (Nagad), রকেট (Rocket), ক্রেডিট/ডেবিট কার্ড এবং ক্যাশ অন ডেলিভারি (COD) পেমেন্ট সমর্থন করি। পেমেন্ট সম্পূর্ণ এনক্রিপ্টেড ও সুরক্ষিত।';
          } else if (lower.includes('অর্ডার') || lower.includes('ট্র্যাকিং')) {
            fallbackReply = 'আপনি নেভিগেশন বারের "অর্ডার ট্র্যাকিং" ট্যাবে ক্লিক করে আপনার অর্ডার আইডি (যেমন: ORD-...) লিখে সরাসরি লাইভ স্ট্যাটাস দেখতে পারবেন!';
          } else if (lower.includes('রিটার্ন') || lower.includes('ফেরত')) {
            fallbackReply = 'পণ্য পাওয়ার ৭ দিনের মধ্যে ত্রুটিপূর্ণ পণ্য বিনামূল্যে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন। আমাদের হেল্পলাইনে বা চ্যাটে যোগাযোগ করলেই ব্যবস্থা করা হবে।';
          } else {
            fallbackReply = `ধন্যবাদ আপনার বার্তার জন্য! AmarShop কাস্টমার সার্ভিসে আপনাকে স্বাগতম। আপনি পণ্য নির্বাচন, কার্টে যোগ, এক্সপ্রেস ডেলিভারি নির্বাচন এবং বিকাশ/নগদে সহজে অর্ডার করতে পারেন। কোনো বিশেষ পণ্য সম্পর্কে জানতে চান?`;
          }
        } else {
          if (lower.includes('delivery') || lower.includes('shipping')) {
            fallbackReply = 'We offer standard delivery within 2-3 business days and express delivery within 12-24 hours across all regions with live parcel tracking.';
          } else if (lower.includes('payment') || lower.includes('pay') || lower.includes('bkash')) {
            fallbackReply = 'We accept bKash, Nagad, Rocket, Credit/Debit Cards, and Cash on Delivery (COD) with complete 256-bit SSL encryption.';
          } else if (lower.includes('track') || lower.includes('order')) {
            fallbackReply = 'You can track your parcel live anytime by visiting the "Order Tracking" section and entering your order number (e.g. ORD-1001).';
          } else {
            fallbackReply = 'Welcome to AmarShop Customer Support! How can I assist you today with product catalog, orders, discounts, or express delivery?';
          }
        }
        return res.json({ reply: fallbackReply });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are a polite, helpful, and professional customer support assistant for "AmarShop", a top e-commerce platform in Bangladesh.
Current language preference: ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
Features of AmarShop:
- Products: Electronics, Fashion, Gadgets, Groceries, Home Living, Accessories.
- Fast Delivery: Standard delivery 2-3 days, Express Fast Delivery within 12-24 hours.
- Payment Options: bKash, Nagad, Rocket, Visa/Mastercard/Amex, Cash on Delivery (COD).
- 2FA Security, Order Tracking with live visual milestones, 7-day hassle-free return policy.
- Always respond concisely, warmly, and directly in the user's selected language (${language === 'bn' ? 'Bengali' : 'English'}).
- Keep responses within 2-4 friendly sentences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nUser Question: ${message}`,
              },
            ],
          },
        ],
      });

      const reply = response.text || 'ধন্যবাদ আপনার বার্তার জন্য! আমাদের প্রতিনিধি শীঘ্রই সহায়তা করবে।';
      return res.json({ reply });
    } catch (error: any) {
      console.error('Chatbot API error:', error);
      res.json({
        reply:
          req.body.language === 'bn'
            ? 'আমাদের সিস্টেমে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে একটু পর চেষ্টা করুন অথবা লাইভ সাপোর্টে বার্তা দিন।'
            : 'We are experiencing temporary service delay. Please try again or reach out to live support.',
      });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
