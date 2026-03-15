import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When this module is run directly, server.js dotenv setup does not run.
// Load backend/.env here as a safe fallback if SMTP vars are missing.
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

// Create transporter
const createTransporter = ({ host, port }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(port || process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecureRaw = typeof process.env.SMTP_SECURE === 'string'
    ? process.env.SMTP_SECURE.toLowerCase().trim()
    : undefined;
  const smtpSecure =
    !smtpSecureRaw || smtpSecureRaw === 'auto'
      ? smtpPort === 465
      : smtpSecureRaw === 'true';
  const smtpRequireTLS =
    typeof process.env.SMTP_REQUIRE_TLS === 'string' &&
    process.env.SMTP_REQUIRE_TLS.toLowerCase() === 'true';
  const smtpRejectUnauthorized =
    typeof process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'string'
      ? process.env.SMTP_TLS_REJECT_UNAUTHORIZED.toLowerCase() !== 'false'
      : true;

  // Keep SMTP failures fast so API requests do not hang in production.
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000);
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT || 10000);
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT || 15000);

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      'Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment variables'
    );
  }

  return nodemailer.createTransport({
    host: host || smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: smtpRequireTLS,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    tls: {
      rejectUnauthorized: smtpRejectUnauthorized
    },
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const getTransportTargets = () => {
  const smtpHost = process.env.SMTP_HOST;
  const primaryPort = Number(process.env.SMTP_PORT || 587);
  const fallbackPorts = (process.env.SMTP_FALLBACK_PORTS || '465')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  const allPorts = [primaryPort, ...fallbackPorts].filter(
    (port, index, arr) => Number.isInteger(port) && arr.indexOf(port) === index
  );

  return allPorts.map((port) => ({ host: smtpHost, port }));
};

const RETRYABLE_SMTP_CODES = new Set([
  'ETIMEDOUT',
  'ECONNECTION',
  'ESOCKET',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENOTFOUND'
]);

const sendViaResend = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not configured', skipped: true };
    }

    if (typeof fetch !== 'function') {
      return { success: false, error: 'Global fetch is not available in this Node runtime' };
    }

    const fromAddress = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!fromAddress) {
      return {
        success: false,
        error: 'Missing sender address. Set RESEND_FROM (or SMTP_FROM/SMTP_USER)'
      };
    }

    const payload = {
      from: `Sri Murugan Tours <${fromAddress}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    };

    if (text) {
      payload.text = text;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Resend API error (${response.status})`,
        status: response.status,
        details: data
      };
    }

    return {
      success: true,
      messageId: data?.id,
      provider: 'resend'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: 'resend'
    };
  }
};

// Send email helper
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const providerPreference = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase();
    const canUseResend = Boolean(process.env.RESEND_API_KEY);
    const shouldTryResendFirst =
      providerPreference === 'resend' ||
      (providerPreference === 'auto' && canUseResend && process.env.NODE_ENV === 'production');

    if (shouldTryResendFirst) {
      const resendResult = await sendViaResend({ to, subject, html, text });
      if (resendResult.success) {
        console.log('Email sent via Resend:', resendResult.messageId);
        return resendResult;
      }
      console.warn('Resend send failed, falling back to SMTP:', resendResult.error);
    }

    const targets = getTransportTargets();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: `"Sri Murugan Tours" <${fromAddress}>`,
      to,
      subject,
      html,
      text
    };

    let lastError;

    for (const target of targets) {
      try {
        const transporter = createTransporter(target);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent via ${target.host}:${target.port}:`, info.messageId);
        return {
          success: true,
          messageId: info.messageId,
          host: target.host,
          port: target.port
        };
      } catch (error) {
        lastError = error;
        const shouldRetry = RETRYABLE_SMTP_CODES.has(error.code);

        if (!shouldRetry) {
          break;
        }

        console.warn(`SMTP attempt failed on ${target.host}:${target.port} with ${error.code}, trying next target`);
      }
    }

    console.error('Email error:', {
      message: lastError?.message,
      code: lastError?.code,
      command: lastError?.command,
      attemptedTargets: targets.map((target) => `${target.host}:${target.port}`).join(', ')
    });

    // Optional fallback provider when SMTP is unreachable on hosting platform.
    if (canUseResend && !shouldTryResendFirst) {
      const resendResult = await sendViaResend({ to, subject, html, text });
      if (resendResult.success) {
        console.log('Email sent via Resend fallback:', resendResult.messageId);
        return resendResult;
      }
      console.error('Resend fallback failed:', resendResult.error);
    }

    return { success: false, error: lastError?.message || 'SMTP send failed', code: lastError?.code };
  } catch (error) {
    console.error('Email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT
    });
    return { success: false, error: error.message, code: error.code };
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (email, resetToken, name) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sri Murugan Tours</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You have requested to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Sri Murugan Tours Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Murugan Tours. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - Sri Murugan Tours',
    html,
    text: `Hello ${name}, Click the following link to reset your password: ${resetUrl}. This link expires in 1 hour.`
  });
};

// Booking Status Email
export const sendBookingStatusEmail = async (email, name, booking, status, driverDetails = null) => {
  let statusMessage, statusColor;

  switch (status) {
    case 'accepted':
      statusMessage = 'Your booking has been accepted!';
      statusColor = '#28a745';
      break;
    case 'declined':
      statusMessage = 'Your booking has been declined.';
      statusColor = '#dc3545';
      break;
    case 'completed':
      statusMessage = 'Your trip has been marked as completed.';
      statusColor = '#17a2b8';
      break;
    default:
      statusMessage = 'Your booking status has been updated.';
      statusColor = '#6c757d';
  }

  const driverSection = driverDetails ? `
    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2e7d32; margin-top: 0;">Driver Details</h3>
      <p><strong>Name:</strong> ${driverDetails.name}</p>
      <p><strong>Phone:</strong> ${driverDetails.phone}</p>
      <p><strong>License No:</strong> ${driverDetails.licenseNumber}</p>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sri Murugan Tours</h1>
        </div>
        <div class="content">
          <h2>Booking Update</h2>
          <p>Hello ${name},</p>
          <p style="text-align: center;">
            <span class="status-badge">${statusMessage}</span>
          </p>
          
          <div class="details">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Destination:</strong> ${booking.tripDetails.destination}</p>
            <p><strong>Travel Date:</strong> ${new Date(booking.tripDetails.startDate).toLocaleDateString()}</p>
            <p><strong>Group Size:</strong> ${booking.groupDetails.total} persons</p>
          </div>

          ${driverSection}

          ${booking.declineReason ? `
            <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #c62828; margin-top: 0;">Reason</h3>
              <p>${booking.declineReason}</p>
            </div>
          ` : ''}

          <p>You can view more details in your dashboard.</p>
          <p>Best regards,<br>Sri Murugan Tours Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Murugan Tours. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${booking.bookingId}`,
    html,
    text: `Hello ${name}, ${statusMessage} Booking ID: ${booking.bookingId}, Destination: ${booking.tripDetails.destination}`
  });
};

// Booking Confirmation Email
export const sendBookingConfirmationEmail = async (email, name, booking) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-id { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sri Murugan Tours</h1>
          <p>Booking Confirmed!</p>
        </div>
        <div class="content">
          <h2>Thank You for Your Booking!</h2>
          <p>Hello ${name},</p>
          <p>Your booking has been received and is pending review by our team.</p>
          
          <div class="booking-id">
            ${booking.bookingId}
          </div>
          
          <div class="details">
            <h3>Trip Summary</h3>
            <p><strong>From:</strong> ${booking.tripDetails.departureCity}</p>
            <p><strong>To:</strong> ${booking.tripDetails.destination}</p>
            <p><strong>Date:</strong> ${new Date(booking.tripDetails.startDate).toLocaleDateString()} - ${new Date(booking.tripDetails.endDate).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> ${booking.tripDetails.duration} days</p>
            <p><strong>Group Size:</strong> ${booking.groupDetails.total} persons</p>
            <p><strong>Amount Paid:</strong> ₹${booking.payment.amount.toLocaleString()}</p>
          </div>

          <p>We will review your booking and get back to you within 24-48 hours.</p>
          <p>Best regards,<br>Sri Murugan Tours Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sri Murugan Tours. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Booking Confirmed - ${booking.bookingId}`,
    html,
    text: `Hello ${name}, Your booking ${booking.bookingId} has been confirmed and is pending review.`
  });
};
