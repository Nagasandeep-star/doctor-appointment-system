const nodemailer = require('nodemailer');

/**
 * Email service — Nodemailer wrapper.
 * Gracefully no-ops if SMTP credentials are not configured.
 * Booking never fails because of email errors.
 */

let transporter = null;

const isConfigured = () => {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

const getTransporter = () => {
  if (!isConfigured()) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send an email. Returns true if sent, false if skipped/failed.
 */
const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [Email Skipped] Email not configured. Would send "${subject}" to ${to}`);
    return false;
  }

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || '"DocAppoint" <noreply@docappoint.com>',
      to,
      subject,
      html,
    });
    console.log(`📧 [Email Sent] "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`📧 [Email Error] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
};

/**
 * Booking confirmation email.
 */
const sendBookingConfirmation = async ({ patientEmail, patientName, doctorName, date, startTime }) => {
  return sendEmail({
    to: patientEmail,
    subject: `Appointment Confirmed — ${date} at ${startTime}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#6366f1;margin:0 0 16px">Appointment Confirmed ✅</h2>
        <p>Hi <strong>${patientName}</strong>,</p>
        <p>Your appointment has been booked successfully.</p>
        <table style="margin:16px 0;font-size:14px;width:100%">
          <tr><td style="color:#64748b;padding:4px 8px">Doctor</td><td style="font-weight:600;padding:4px 8px">${doctorName}</td></tr>
          <tr><td style="color:#64748b;padding:4px 8px">Date</td><td style="font-weight:600;padding:4px 8px">${date}</td></tr>
          <tr><td style="color:#64748b;padding:4px 8px">Time</td><td style="font-weight:600;padding:4px 8px">${startTime}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px">If you need to cancel or reschedule, please log in to your DocAppoint account.</p>
      </div>
    `,
  });
};

/**
 * Cancellation notification email.
 */
const sendCancellationEmail = async ({ patientEmail, patientName, doctorName, date, startTime }) => {
  return sendEmail({
    to: patientEmail,
    subject: `Appointment Cancelled — ${date} at ${startTime}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#ef4444;margin:0 0 16px">Appointment Cancelled ❌</h2>
        <p>Hi <strong>${patientName}</strong>,</p>
        <p>Your appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${startTime}</strong> has been cancelled.</p>
        <p style="color:#64748b;font-size:13px">You can book a new appointment anytime through DocAppoint.</p>
      </div>
    `,
  });
};

/**
 * Appointment reminder email (24h before).
 */
const sendReminderEmail = async ({ patientEmail, patientName, doctorName, date, startTime }) => {
  return sendEmail({
    to: patientEmail,
    subject: `Reminder: Appointment Tomorrow — ${date} at ${startTime}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#f59e0b;margin:0 0 16px">Appointment Reminder ⏰</h2>
        <p>Hi <strong>${patientName}</strong>,</p>
        <p>This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
        <table style="margin:16px 0;font-size:14px;width:100%">
          <tr><td style="color:#64748b;padding:4px 8px">Doctor</td><td style="font-weight:600;padding:4px 8px">${doctorName}</td></tr>
          <tr><td style="color:#64748b;padding:4px 8px">Date</td><td style="font-weight:600;padding:4px 8px">${date}</td></tr>
          <tr><td style="color:#64748b;padding:4px 8px">Time</td><td style="font-weight:600;padding:4px 8px">${startTime}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px">Please arrive on time. If you need to cancel, log in to your DocAppoint account.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendReminderEmail,
  isConfigured,
};
