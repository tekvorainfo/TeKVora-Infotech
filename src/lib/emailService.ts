import { supabase } from './supabase';

/**
 * Sends an email via the Supabase `send-email` Edge Function.
 * On localhost with mock client, it logs to console instead of failing silently.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    // Try 'quick-responder' first, then fallback to 'send-email'
    let result = await supabase.functions.invoke('quick-responder', {
      body: { to, subject, html },
    });

    if (result.error && result.error.message?.includes('404')) {
      result = await supabase.functions.invoke('send-email', {
        body: { to, subject, html },
      });
    }

    if (result.error) {
      console.warn('[EmailService] Edge function response:', result.error);
    } else {
      console.log('[EmailService] Email sent successfully:', result.data);
    }
  } catch (err) {
    console.warn('[EmailService] Could not invoke email function:', err);
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export function contactConfirmationHtml(name: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px 40px;">
        <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height:40px;margin-bottom:16px;" />
        <h1 style="color:#fff;margin:0;font-size:22px;">Thank You, ${name}!</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;line-height:1.7;">
          We've received your message and our team will get back to you within <strong>24 hours</strong>.
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.7;">
          For urgent queries, you can reach us directly on WhatsApp:
        </p>
        <a href="https://wa.me/919022302322" style="display:inline-block;margin-top:8px;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          💬 Chat on WhatsApp
        </a>
      </div>
      <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">TeKVora Infotech · info@tekvora.com · +91 9022302322</p>
      </div>
    </div>
  `;
}

export function adminContactNotificationHtml(name: string, email: string, phone: string, subject: string, message: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="background:#1e293b;padding:24px 32px;">
        <h2 style="color:#fff;margin:0;font-size:18px;">📬 New Contact Submission</h2>
      </div>
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
          <tr><td style="padding:8px 0;font-weight:600;width:120px;">Name</td><td>${name}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Phone</td><td>${phone || '—'}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Subject</td><td>${subject || '—'}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Message</td><td style="white-space:pre-wrap;">${message}</td></tr>
        </table>
        <a href="mailto:${email}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Reply to ${name}
        </a>
      </div>
    </div>
  `;
}

export function internshipApplicationHtml(name: string, internshipTitle: string, email: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#ea580c,#f97316);padding:32px 40px;">
        <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height:40px;margin-bottom:16px;" />
        <h1 style="color:#fff;margin:0;font-size:22px;">Application Received! 🎉</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;">
          Your application for <strong>${internshipTitle}</strong> has been successfully received.
          Our team will review it and get back to you within <strong>3 working days</strong>.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#166534;font-size:14px;">✅ Application confirmed for: <strong>${internshipTitle}</strong></p>
        </div>
        <p style="color:#374151;font-size:14px;">We'll contact you at <strong>${email}</strong> with next steps.</p>
        <a href="https://tekvora.in/internships" style="display:inline-block;margin-top:12px;background:#ea580c;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View Internships
        </a>
      </div>
      <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">TeKVora Infotech · info@tekvora.com · +91 9022302322</p>
      </div>
    </div>
  `;
}

export function feeReminderHtml(studentName: string, courseName: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;">
        <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height:40px;margin-bottom:16px;" />
        <h1 style="color:#fff;margin:0;font-size:20px;">Payment Reminder 🔔</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;">
          This is a friendly reminder that your payment for <strong>${courseName}</strong> is still pending.
          Please complete the payment to secure your enrollment and access course materials.
        </p>
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#92400e;font-size:14px;">⚠️ Course access will be activated only after payment verification.</p>
        </div>
        <a href="https://tekvora.in/dashboard" style="display:inline-block;margin-top:12px;background:#7c3aed;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Complete Payment
        </a>
      </div>
      <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">TeKVora Infotech · info@tekvora.com · +91 9022302322</p>
      </div>
    </div>
  `;
}

export function internWelcomeHtml(fullName: string, internId: string, internshipTitle: string, tempPassword: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;">
        <img src="https://tekvora.in/new_logo.png" alt="TeKVora" style="height:40px;margin-bottom:16px;" />
        <h1 style="color:#fff;margin:0;font-size:22px;">Welcome to TeKVora! 🚀</h1>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${fullName}</strong>,</p>
        <p style="color:#374151;font-size:15px;line-height:1.7;">
          Congratulations! You have been activated as an intern for <strong>${internshipTitle}</strong>.
        </p>
        <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#5b21b6;font-weight:700;font-size:13px;">YOUR LOGIN CREDENTIALS</p>
          <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>Intern ID:</strong> ${internId}</p>
          <p style="margin:4px 0;font-size:14px;color:#374151;"><strong>Temporary Password:</strong> <code style="background:#ede9fe;padding:2px 8px;border-radius:4px;">${tempPassword}</code></p>
          <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">⚠️ Please change your password after first login.</p>
        </div>
        <a href="https://tekvora.in/intern-login" style="display:inline-block;margin-top:8px;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          Login to Intern Dashboard →
        </a>
      </div>
      <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">TeKVora Infotech · info@tekvora.com · +91 9022302322</p>
      </div>
    </div>
  `;
}
