import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logoDiskPath = path.resolve(__dirname, '../../public/logo.png')
const hasLogoOnDisk = fs.existsSync(logoDiskPath)

const gmailUser = process.env.GMAIL_USER || 'josdinner7@gmail.com'
const gmailPass = process.env.GMAIL_PASS || 'jnbrwdswynqjmuls'
const clientUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
})

// Helper function to send Gmail HTML verification code
export async function sendGmailCode(toEmail, toName, code) {
  const mailOptions = {
    from: `"Jo's Diner" <${gmailUser}>`,
    to: toEmail,
    subject: `[Jo's Diner] Your Verification Code is ${code}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-family: 'Russo One', 'Orbitron', Arial, sans-serif; color: #C8102E; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">JO'S DINER</h1>
            <p style="color: #071A3D; font-weight: bold; margin-top: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Customer Portal Registration</p>
          </div>
          <h2 style="color: #071A3D; text-align: center; font-size: 20px; margin-top: 0;">Email Activation Code</h2>
          <p style="color: #334155; font-size: 14px;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">Thank you for signing up at Jo's Diner! Please enter the 6-digit verification code below to activate your account:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #C8102E; background: #fef2f2; padding: 14px 28px; border-radius: 14px; border: 2px dashed #C8102E; display: inline-block;">
              ${code}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">This code will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">If you did not register for a Jo's Diner account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Helper function to send Gmail HTML password reset code
export async function sendGmailPasswordResetCode(toEmail, toName, code) {
  const mailOptions = {
    from: `"Jo's Diner Security" <${gmailUser}>`,
    to: toEmail,
    subject: `[Jo's Diner] Password Reset Code: ${code}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-family: 'Russo One', 'Orbitron', Arial, sans-serif; color: #C8102E; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">JO'S DINER</h1>
            <p style="color: #071A3D; font-weight: bold; margin-top: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Security & Password Recovery</p>
          </div>
          <h2 style="color: #071A3D; text-align: center; font-size: 20px; margin-top: 0;">Password Reset Verification Code</h2>
          <p style="color: #334155; font-size: 14px;">Hi <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">We received a request to reset your account password at Jo's Diner. Please enter the 6-digit reset code below to verify your identity:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #C8102E; background: #fef2f2; padding: 14px 28px; border-radius: 14px; border: 2px dashed #C8102E; display: inline-block;">
              ${code}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">This security code will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">If you did not request a password reset, please ignore this message or ensure your account is secure.</p>
        </div>
      </body>
      </html>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Helper function to send Reservation Confirmation with scannable QR Code
export async function sendReservationQREmail(reservation, customEmail = null) {
  const { generateReservationQR } = await import('./qrGenerator.js')

  const toEmail = customEmail || reservation.email
  if (!toEmail) {
    console.warn('[Mailer] No email address provided for reservation QR email.')
    return { success: false, message: 'No recipient email address' }
  }

  const resCode = reservation.reservation_code || reservation.id || `RES-${reservation.reservation_id || '00000'}`
  const guestName = reservation.contact_name || reservation.contact_person || 'Valued Guest'
  const guestPhone = reservation.contact_phone || reservation.phone || 'N/A'
  const eventDate = reservation.event_date ? String(reservation.event_date).split('T')[0] : 'Scheduled Date'
  const eventTime = reservation.event_time || reservation.time || 'Scheduled Time'
  const guestCount = reservation.guest_count || reservation.guests || 2
  const venue = reservation.hall_name || reservation.package_name || reservation.category || 'Main Dining Area'
  const occasion = reservation.event_name || reservation.occasion || reservation.event_type || 'Table Reservation'
  const specialRequests = reservation.special_requests || reservation.special_request || 'None'
  const totalAmount = reservation.total_amount ? `₱${Number(reservation.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null

  // Generate QR Code Buffer
  const { qrBuffer, qrPayload } = await generateReservationQR(reservation)

  const mailOptions = {
    from: `"Jo's Diner Reservations" <${gmailUser}>`,
    to: toEmail,
    subject: `[Jo's Diner] Reservation Confirmed: ${resCode} - Your Entry QR Code Inside`,
    attachments: [
      {
        filename: `JosDiner-Reservation-${resCode}-QR.png`,
        content: qrBuffer,
        cid: 'jos-reservation-qr',
        contentType: 'image/png'
      }
    ],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jo's Diner Reservation Pass</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 580px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                
                <!-- HEADER BANNER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #071A3D 0%, #0F2856 50%, #C8102E 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
                    <div style="font-family: 'Russo One', 'Orbitron', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 2px; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-transform: uppercase;">
                      JO'S DINER
                    </div>
                    <div style="font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #fecdd3;">
                      Function Hall & Catering Services
                    </div>
                    <div style="margin-top: 18px; display: inline-block; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px); padding: 6px 18px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.3); font-size: 13px; font-weight: 600;">
                      🎟️ Official Reservation Pass & QR Ticket
                    </div>
                  </td>
                </tr>

                <!-- GREETING & NOTICE -->
                <tr>
                  <td style="padding: 28px 32px 16px 32px;">
                    <h2 style="margin: 0 0 8px 0; color: #071A3D; font-size: 22px; font-weight: 800;">
                      Hello, ${guestName}!
                    </h2>
                    <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">
                      Your reservation at <strong>Jo's Diner</strong> is confirmed. Below is your official entry QR Code pass.
                    </p>
                  </td>
                </tr>

                <!-- QR CODE HIGHLIGHT BOX (STAFF & ADMIN SCANNER INSTRUCTIONS) -->
                <tr>
                  <td style="padding: 0 32px;">
                    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 18px; padding: 24px; text-align: center; margin: 12px 0;">
                      
                      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #C8102E; margin-bottom: 12px;">
                        SCAN UPON ARRIVAL
                      </div>

                      <!-- QR Code Image -->
                      <div style="display: inline-block; background: #ffffff; padding: 14px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                        <img src="cid:jos-reservation-qr" alt="Reservation QR Code" width="220" height="220" style="display: block; width: 220px; height: 220px; margin: 0 auto; border-radius: 8px;" />
                      </div>

                      <div style="margin-top: 14px; font-size: 18px; font-weight: 900; color: #071A3D; letter-spacing: 1px;">
                        ${resCode}
                      </div>

                      <!-- High-visibility Scanner Instructions -->
                      <div style="margin-top: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 16px; text-align: left;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td width="28" valign="top" style="font-size: 20px; line-height: 1;">📱</td>
                            <td style="font-size: 13px; color: #1e40af; line-height: 1.5;">
                              <strong>For Staff & Admin Scan:</strong> Present this QR code on your phone or print this ticket upon arriving. Our Staff and Admin will scan this QR pass for instant check-in, zero wait-times, and rapid seating.
                            </td>
                          </tr>
                        </table>
                      </div>

                    </div>
                  </td>
                </tr>

                <!-- RESERVATION SUMMARY TABLE -->
                <tr>
                  <td style="padding: 16px 32px 28px 32px;">
                    <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #071A3D; margin-bottom: 12px;">
                      Booking Summary
                    </div>

                    <table role="presentation" width="100%" style="border-collapse: collapse; font-size: 14px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
                      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600; width: 35%;">Booking Reference</td>
                        <td style="padding: 10px 14px; color: #071A3D; font-weight: 800;">${resCode}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Date & Time</td>
                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">📅 ${eventDate} at ⏰ ${eventTime}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #f1f5f9; background: #fdfdfd;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Party Size</td>
                        <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">👥 ${guestCount} Guests</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Occasion / Venue</td>
                        <td style="padding: 10px 14px; color: #0f172a;">${occasion} • <strong>${venue}</strong></td>
                      </tr>
                      <tr style="border-bottom: 1px solid #f1f5f9; background: #fdfdfd;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Contact Phone</td>
                        <td style="padding: 10px 14px; color: #0f172a;">📞 ${guestPhone}</td>
                      </tr>
                      ${totalAmount ? `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Total Amount</td>
                        <td style="padding: 10px 14px; color: #C8102E; font-weight: 800;">${totalAmount}</td>
                      </tr>
                      ` : ''}
                      ${specialRequests && specialRequests !== 'None' ? `
                      <tr style="background: #fffbeb;">
                        <td style="padding: 10px 14px; color: #b45309; font-weight: 600;">Special Request</td>
                        <td style="padding: 10px 14px; color: #92400e;">${specialRequests}</td>
                      </tr>
                      ` : ''}
                    </table>

                    <!-- FOOTER HELP -->
                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">
                        Need to modify or cancel your booking? Please contact us in advance.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        Jo's Diner &bull; Function Hall & Catering Services &bull; Powered by Jo's Diner Online System
                      </p>
                    </div>

                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Jo's Diner - Reservation Confirmed (${resCode})
===================================================
Hello ${guestName},

Your reservation at Jo's Diner has been confirmed!
Reference Code: ${resCode}
Date & Time: ${eventDate} at ${eventTime}
Party Size: ${guestCount} Guests
Venue/Table: ${venue} (${occasion})

STAFF & ADMIN SCAN INSTRUCTIONS:
Please present your QR code pass (attached to this email) upon arrival.
Our Staff and Admin will scan your QR code for instant check-in and seating.

Thank you for choosing Jo's Diner!
    `
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(`[Mailer] Reservation QR pass sent to ${toEmail} for ${resCode}. Message ID: ${info.messageId}`)
  return { success: true, messageId: info.messageId, email: toEmail }
}

// Helper function to send Reservation Notification Center notices directly to Gmail
export async function sendNotificationGmail(notification, customRecipient = null) {
  const toEmail = customRecipient || notification.recipient_email
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, message: 'No valid recipient email address found.' }
  }

  const type = notification.type || 'booking_update'
  const title = notification.title || "Notification from Jo's Diner"
  const message = notification.message || ''
  const code = notification.reservation_code || notification.order_code || ''

  // Detect if this is an order-related notification
  const isOrderNotification = type.startsWith('order_') || (code && code.toString().toUpperCase().startsWith('ORD'))
  const refLabel = isOrderNotification ? 'Order Ref' : 'Booking Ref'

  let badgeLabel = 'Notice'
  let bannerColor = '#334155'
  let accentColor = '#475569'
  let emojiIcon = '📢'

  switch (type) {
    case 'approval_notice':
      badgeLabel = 'Reservation Approved & Confirmed'
      bannerColor = '#065f46'
      accentColor = '#059669'
      emojiIcon = '✅'
      break
    case 'payment_confirmation':
      badgeLabel = 'Payment Confirmed'
      bannerColor = '#047857'
      accentColor = '#10b981'
      emojiIcon = '💳'
      break
    case 'booking_reminder':
      badgeLabel = 'Upcoming Reservation Reminder'
      bannerColor = '#92400e'
      accentColor = '#d97706'
      emojiIcon = '⏰'
      break
    case 'cancellation_alert':
      badgeLabel = 'Reservation Cancelled'
      bannerColor = '#991b1b'
      accentColor = '#dc2626'
      emojiIcon = '⚠️'
      break
    case 'system_alert':
      badgeLabel = 'System Notice'
      bannerColor = '#581c87'
      accentColor = '#7c3aed'
      emojiIcon = '🔔'
      break
    case 'order_completed':
    case 'order_update':
    case 'order_ready':
      badgeLabel = 'Order Update'
      bannerColor = '#1e40af'
      accentColor = '#3b82f6'
      emojiIcon = '🍽️'
      break
    case 'booking_update':
    default:
      badgeLabel = isOrderNotification ? 'Order Update' : 'Booking Update'
      bannerColor = isOrderNotification ? '#1e40af' : '#0f766e'
      accentColor = isOrderNotification ? '#3b82f6' : '#0d9488'
      emojiIcon = isOrderNotification ? '🍽️' : '📋'
      break
  }

  const attachments = []
  if (hasLogoOnDisk) {
    attachments.push({
      filename: 'logo.png',
      path: logoDiskPath,
      cid: 'jos-diner-header-logo'
    })
  }

  const mailOptions = {
    from: `"Jo's Diner Notifications" <${gmailUser}>`,
    to: toEmail,
    subject: `[Jo's Diner] ${emojiIcon} ${title} ${code ? `(#${code})` : ''}`,
    attachments,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">

                <!-- DESIGNED BRAND HEADER -->
                <tr>
                  <td style="background: #ffffff; padding: 28px 32px 22px 32px; text-align: center; border-bottom: 3px solid #C8102E;">
                    ${hasLogoOnDisk ? `
                    <div style="margin-bottom: 10px; line-height: 1;">
                      <img src="cid:jos-diner-header-logo" alt="Jo's Diner Logo" style="height: 48px; width: auto; max-width: 140px; display: inline-block; vertical-align: middle;" />
                    </div>
                    ` : ''}
                    <h1 style="font-family: 'Russo One', 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #071A3D; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; line-height: 1.2;">
                      JO'S <span style="color: #C8102E;">DINER</span>
                    </h1>
                    <p style="color: #64748b; margin: 6px 0 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 2.2px; font-weight: 700; line-height: 1.4;">
                      Function Hall &amp; Catering Services &bull; Notification Center
                    </p>
                  </td>
                </tr>

                <!-- COLORED CATEGORY BANNER -->
                <tr>
                  <td style="background: ${bannerColor}; padding: 12px 28px; text-align: center;">
                    <span style="color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                      ${emojiIcon} ${badgeLabel}
                    </span>
                  </td>
                </tr>

                <!-- NOTICE CONTENT -->
                <tr>
                  <td style="padding: 28px 32px 24px 32px;">
                    ${code ? `
                    <div style="margin-bottom: 16px;">
                      <span style="display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; font-family: monospace; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">
                        ${refLabel}: ${code}
                      </span>
                    </div>
                    ` : ''}

                    <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 12px 0; line-height: 1.3;">
                      ${title}
                    </h2>

                    <div style="background: #f8fafc; border-left: 4px solid ${accentColor}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; font-weight: 500;">
                        ${message}
                      </p>
                    </div>

                    <!-- ACTION BUTTON -->
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${clientUrl}/notifications" style="display: inline-block; background: #C8102E; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 2px 8px rgba(200, 16, 46, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                        Open Notification Center
                      </a>
                    </div>

                    <!-- INFO FOOTNOTE -->
                    <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 10px; text-align: left; font-size: 12px; color: #475569; line-height: 1.5;">
                      <strong>ℹ️ Need assistance?</strong> You can review, track, and manage all your reservations and alerts anytime inside your Jo's Diner Customer Hub or visit our front counter.
                    </div>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                    <p style="margin: 0 0 4px 0;">This is an automated notification from Jo's Diner Reservation System.</p>
                    <p style="margin: 0;">Sent to <strong>${toEmail}</strong> &bull; &copy; 2026 Jo's Diner. All rights reserved.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
[Jo's Diner] ${badgeLabel}
==============================================
${title}
${code ? `Booking Reference: ${code}\n` : ''}
${message}

You can view all your alerts, booking statuses, and QR tickets in the Reservation Notification Center:
${clientUrl}/notifications

Jo's Diner - Function Hall & Catering Services
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[Mailer] Notification email sent to ${toEmail} for [${type}]: ${title}. Message ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId, email: toEmail }
  } catch (err) {
    console.error(`[Mailer] Error sending notification email to ${toEmail}:`, err.message)
    return { success: false, message: err.message }
  }
}


// ─────────────────────────────────────────────────────────────
// REJECTION / CANCELLATION EMAIL — Branded HTML
// ─────────────────────────────────────────────────────────────
export async function sendRejectionEmail(reservation, reason = '') {
  const { contact_name, email, reservation_code, event_date, event_time, event_type, guest_count } = reservation
  if (!email || !email.includes('@')) return { success: false, message: 'No valid email' }
  const displayReason = reason || 'After careful review, we are unable to accommodate this reservation at this time. Please try a different date or time.'
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;"><div style="background:linear-gradient(135deg,#071A3D 0%,#0f2d6e 100%);padding:32px 40px;text-align:center;"><h1 style="font-family:'Russo One','Orbitron',Arial,sans-serif;color:#C8102E;margin:0;font-size:32px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">JO'S DINER</h1><p style="color:#94a3b8;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 0 0;">Function Hall &amp; Catering Services</p></div><div style="height:4px;background:linear-gradient(90deg,#C8102E,#ff4d6d,#C8102E);"></div><div style="padding:40px;"><div style="text-align:center;margin-bottom:28px;"><span style="display:inline-block;background:#fef2f2;border:2px solid #fca5a5;color:#C8102E;font-weight:800;font-size:13px;padding:8px 20px;border-radius:100px;text-transform:uppercase;">&#10007; Reservation Declined</span></div><h2 style="color:#071A3D;font-size:22px;font-weight:800;margin:0 0 8px 0;text-align:center;">We are Sorry, ${contact_name}</h2><p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 28px 0;">Your reservation request could not be confirmed at this time.</p><div style="background:#f8fafc;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">Reference No.</td><td style="padding:6px 0;color:#071A3D;font-weight:800;font-size:13px;">#${reservation_code}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Booking Type</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${event_type || 'Table Reservation'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Date and Time</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${event_date || '-'} - ${event_time || '-'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Party Size</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${guest_count || '-'} Guest(s)</td></tr></table></div><div style="background:#fef2f2;border-left:4px solid #C8102E;border-radius:0 12px 12px 0;padding:18px 20px;margin-bottom:28px;"><p style="color:#7f1d1d;font-size:13px;font-weight:700;margin:0 0 6px 0;">Reason:</p><p style="color:#991b1b;font-size:14px;margin:0;line-height:1.6;">${displayReason}</p></div><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:28px;"><p style="color:#14532d;font-size:13px;font-weight:700;margin:0 0 8px 0;">What can you do next?</p><ul style="margin:0;padding-left:18px;color:#166534;font-size:13px;line-height:2;"><li>Try a different date or time slot</li><li>Contact us directly for assistance</li><li>Browse other available packages or services</li></ul></div><div style="text-align:center;margin-top:28px;"><a href="${clientUrl}/reservation" style="display:inline-block;background:#C8102E;color:#fff;font-weight:800;font-size:13px;text-decoration:none;padding:14px 32px;border-radius:12px;">Book a New Reservation</a></div></div><div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;"><p style="color:#94a3b8;font-size:11px;margin:0;">Jo's Diner - We hope to serve you soon!</p></div></div></body></html>`
  try {
    const info = await transporter.sendMail({ from: `"Jo's Diner" <${gmailUser}>`, to: email, subject: `[Jo's Diner] Reservation #${reservation_code} - Status Update`, html })
    console.log(`[Mailer] Rejection email sent to ${email} for ${reservation_code}. ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error(`[Mailer] Rejection email error for ${email}:`, err.message)
    return { success: false, message: err.message }
  }
}

export async function sendCompletionEmail(reservation) {
  const { contact_name, email, reservation_code, event_date, event_time, event_type, guest_count, table_number } = reservation
  if (!email || !email.includes('@')) return { success: false, message: 'No valid email' }
  const tableRow = table_number ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">Table Assigned</td><td style="padding:6px 0;color:#16a34a;font-weight:700;font-size:13px;">${table_number}</td></tr>` : ''
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;"><div style="background:linear-gradient(135deg,#071A3D 0%,#0f2d6e 100%);padding:32px 40px;text-align:center;"><h1 style="font-family:'Russo One','Orbitron',Arial,sans-serif;color:#C8102E;margin:0;font-size:32px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">JO'S DINER</h1><p style="color:#94a3b8;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 0 0;">Function Hall &amp; Catering Services</p></div><div style="height:4px;background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a);"></div><div style="padding:40px;"><div style="text-align:center;margin-bottom:28px;"><span style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;color:#16a34a;font-weight:800;font-size:13px;padding:8px 20px;border-radius:100px;text-transform:uppercase;">&#10003; Visit Completed</span></div><h2 style="color:#071A3D;font-size:22px;font-weight:800;margin:0 0 8px 0;text-align:center;">Thank You, ${contact_name}!</h2><p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 28px 0;">We hope you had a wonderful experience dining with us at Jo's Diner.</p><div style="background:#f8fafc;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">Reference No.</td><td style="padding:6px 0;color:#071A3D;font-weight:800;font-size:13px;">#${reservation_code}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Booking Type</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${event_type || 'Table Reservation'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Date and Time</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${event_date || '-'} - ${event_time || '-'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Guests</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${guest_count || '-'}</td></tr>${tableRow}</table></div><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;"><p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 4px 0;">We'd Love to See You Again!</p><p style="color:#3b82f6;font-size:13px;margin:0;">Book your next dining experience with us anytime.</p></div><div style="text-align:center;"><a href="${clientUrl}/reservation" style="display:inline-block;background:#C8102E;color:#fff;font-weight:800;font-size:13px;text-decoration:none;padding:14px 32px;border-radius:12px;">Book Your Next Visit</a></div></div><div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;"><p style="color:#94a3b8;font-size:11px;margin:0;">Jo's Diner - Thank you for choosing us!</p></div></div></body></html>`
  try {
    const info = await transporter.sendMail({ from: `"Jo's Diner" <${gmailUser}>`, to: email, subject: `[Jo's Diner] Thank You for Visiting! - #${reservation_code}`, html })
    console.log(`[Mailer] Completion email sent to ${email} for ${reservation_code}. ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error(`[Mailer] Completion email error for ${email}:`, err.message)
    return { success: false, message: err.message }
  }
}

// ─────────────────────────────────────────────────────────────
// ORDER COMPLETION EMAIL — Branded HTML
// ─────────────────────────────────────────────────────────────
export async function sendOrderCompletionEmail(order) {
  const { customer_name, customer_email, order_code, order_type, grand_total } = order
  if (!customer_email || !customer_email.includes('@')) return { success: false, message: 'No valid email' }
  const totalAmount = grand_total ? `₱${parseFloat(grand_total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'Paid'
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Russo+One&display=swap" rel="stylesheet"></head><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;"><div style="background:linear-gradient(135deg,#071A3D 0%,#0f2d6e 100%);padding:32px 40px;text-align:center;"><h1 style="font-family:'Russo One','Orbitron',Arial,sans-serif;color:#C8102E;margin:0;font-size:32px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">JO'S DINER</h1><p style="color:#94a3b8;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 0 0;">Function Hall &amp; Catering Services</p></div><div style="height:4px;background:linear-gradient(90deg,#16a34a,#4ade80,#16a34a);"></div><div style="padding:40px;"><div style="text-align:center;margin-bottom:28px;"><span style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;color:#16a34a;font-weight:800;font-size:13px;padding:8px 20px;border-radius:100px;text-transform:uppercase;">&#10003; Order Completed</span></div><h2 style="color:#071A3D;font-size:22px;font-weight:800;margin:0 0 8px 0;text-align:center;">Thank You, ${customer_name || 'Valued Guest'}!</h2><p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 28px 0;">Your ${order_type || 'Takeout/Dine-in'} order is now complete! We hope you love every bite from Jo's Diner.</p><div style="background:#f8fafc;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;">Order Reference</td><td style="padding:6px 0;color:#071A3D;font-weight:800;font-size:13px;">#${order_code}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Order Type</td><td style="padding:6px 0;color:#071A3D;font-weight:700;font-size:13px;">${order_type || 'Takeout / Dine-in'}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Total Amount</td><td style="padding:6px 0;color:#C8102E;font-weight:800;font-size:13px;">${totalAmount}</td></tr></table></div><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;"><p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 4px 0;">Enjoy your meal!</p><p style="color:#3b82f6;font-size:13px;margin:0;">We can't wait to serve you again at Jo's Diner.</p></div></div><div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;"><p style="color:#94a3b8;font-size:11px;margin:0;">Jo's Diner - Thank you for choosing us!</p></div></div></body></html>`
  try {
    const info = await transporter.sendMail({ from: `"Jo's Diner" <josdinner7@gmail.com>`, to: customer_email, subject: `[Jo's Diner] Order Completed! - #${order_code}`, html })
    console.log(`[Mailer] Order completion email sent to ${customer_email} for ${order_code}. ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error(`[Mailer] Order completion email error for ${customer_email}:`, err.message)
    return { success: false, message: err.message }
  }
}
