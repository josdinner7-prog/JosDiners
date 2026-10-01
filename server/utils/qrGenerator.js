import QRCode from 'qrcode'

/**
 * Generate a QR code buffer or Data URL for a reservation
 * @param {Object} reservation 
 * @returns {Promise<{ qrBuffer: Buffer, qrDataUrl: string, qrPayload: string }>}
 */
export async function generateReservationQR(reservation) {
  const resCode = reservation.reservation_code || reservation.id || `RES-${reservation.reservation_id || '00000'}`
  const contactName = reservation.contact_name || reservation.contact_person || 'Valued Guest'
  const dateStr = reservation.event_date ? String(reservation.event_date).split('T')[0] : ''
  const timeStr = reservation.event_time || reservation.time || ''
  const pax = reservation.guest_count || reservation.guests || 2
  const token = reservation.qr_token || `JOS-QR-${resCode}`

  // Use clean reservation code as the primary payload for ultra-fast, high-contrast camera scanning
  const qrPayload = resCode

  // Generate PNG Buffer for email CID attachment
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    width: 400,
    margin: 3,
    color: {
      dark: '#071A3D', // Jo's Diner signature navy
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  })

  // Generate Data URL
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 400,
    margin: 3,
    color: {
      dark: '#071A3D',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  })

  return { qrBuffer, qrDataUrl, qrPayload }
}
