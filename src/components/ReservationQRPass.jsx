import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../services/api'
import logo from '../assets/logo.png'

function ReservationQRPass({ reservation, onClose, isDarkMode = false }) {
  const qrCardRef = useRef(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null) // null | 'success' | 'error'
  const [emailMessage, setEmailMessage] = useState('')
  const [targetEmail, setTargetEmail] = useState(reservation?.email || '')
  const [showEmailInput, setShowEmailInput] = useState(!reservation?.email)

  if (!reservation) return null

  const resCode = reservation.reservation_code || reservation.id || `RES-${reservation.reservation_id || '00000'}`
  const contactName = reservation.contact_name || reservation.contact_person || reservation.customer_name || 'Valued Guest'
  const contactPhone = reservation.contact_phone || reservation.phone || ''
  const dateStr = reservation.event_date ? String(reservation.event_date).split('T')[0] : ''
  const timeStr = reservation.event_time || reservation.time || '12:00 PM'
  const pax = reservation.guest_count || reservation.guests || 2
  const venue = reservation.table_number
    ? `Assigned: ${reservation.table_number}`
    : (reservation.hall_name || reservation.category_label || (reservation.category === 'hall' ? 'Function Hall' : reservation.category === 'catering' ? 'Catering Event' : 'Dining Table (Auto on Arrival)'))
  const status = reservation.status || 'Pending'

  // Clean reservation code payload for ultra-fast, high-contrast camera scanning
  const qrPayload = resCode

  // Send / Resend QR Pass to Gmail
  const handleSendEmail = async () => {
    const emailToSend = (targetEmail || reservation.email || '').trim()
    if (!emailToSend || !emailToSend.includes('@')) {
      setEmailStatus('error')
      setEmailMessage('Please enter a valid Gmail address.')
      setShowEmailInput(true)
      return
    }

    setIsSendingEmail(true)
    setEmailStatus(null)
    setEmailMessage('')

    try {
      const res = await api.reservations.sendReservationQREmail({
        code: resCode,
        reservation_id: reservation.reservation_id,
        email: emailToSend
      })

      if (res && res.status === 'success') {
        setEmailStatus('success')
        setEmailMessage(`QR Pass sent to ${emailToSend}! Ready for Staff/Admin scan.`)
      } else {
        setEmailStatus('error')
        setEmailMessage(res?.message || 'Unable to send email. Please try again.')
      }
    } catch (err) {
      console.error('Send QR Email error:', err)
      setEmailStatus('error')
      setEmailMessage(err.message || 'Failed to connect to email server.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Download QR Voucher as PNG
  const handleDownloadQR = () => {
    try {
      const svgElement = qrCardRef.current?.querySelector('svg')
      if (!svgElement) return

      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      // High-res rendering
      canvas.width = 600
      canvas.height = 600

      img.onload = () => {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 50, 50, 500, 500)

        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `JosDiner_QR_${resCode}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch (err) {
      console.error('Download QR failed:', err)
      window.print()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md rounded-xl p-5 sm:p-6 space-y-4 shadow-2xl border transition-all ${
        isDarkMode ? 'bg-[#071A3D] text-white border-slate-700' : 'bg-white text-[#071A3D] border-gray-300'
      }`}>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-gray-200 dark:border-slate-700"
            title="Close Pass"
          >
            <span className="material-icons text-base">close</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="flex items-center justify-center gap-2">
            <img src={logo} alt="Jo's Diner" className="h-8 w-auto object-contain" />
            <span className="jos-diner-brand-title text-sm sm:text-base font-black tracking-wider">
              JO'S DINER
            </span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Official Reservation Pass &amp; Check-In Ticket
          </p>
        </div>

        {/* The Printable / Saveable Ticket Container */}
        <div
          ref={qrCardRef}
          className="p-4 sm:p-5 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800/80 border-2 border-dashed border-gray-300 dark:border-slate-700 space-y-4 text-center"
        >
          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black border ${
              status === 'Confirmed'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status === 'Confirmed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{status === 'Confirmed' ? 'CONFIRMED' : 'PENDING APPROVAL'}</span>
            </span>
          </div>

          {/* QR Code Container with High-Contrast White Background */}
          {status === 'Confirmed' ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3.5 bg-white rounded-xl shadow-md border-2 border-slate-200 inline-block">
                <QRCodeSVG
                  value={qrPayload}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mt-2.5 flex items-center gap-1 justify-center">
                <span className="material-icons text-xs text-[#C8102E]">center_focus_strong</span>
                <span>Hold steady in front of Staff camera scanner</span>
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mx-auto flex items-center justify-center border border-amber-300 dark:border-amber-800">
                <span className="material-icons text-2xl">lock_clock</span>
              </div>
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm">
                QR Pass Locked (Pending Approval)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-xs mx-auto">
                This reservation has not been approved yet. The scannable entry QR pass will be unlocked and sent to your Gmail once Staff or Admin confirms this booking.
              </p>
            </div>
          )}

          {/* Quick Details Grid */}
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-gray-200 dark:border-slate-800 text-left grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Guest Name</span>
              <p className="font-extrabold text-[#071A3D] dark:text-white truncate">
                {contactName}
              </p>
              {contactPhone && <span className="text-[10px] text-gray-400 font-mono">{contactPhone}</span>}
            </div>

            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Date &amp; Time</span>
              <p className="font-extrabold text-[#071A3D] dark:text-white">
                {dateStr}
              </p>
              <span className="text-[10px] text-[#C8102E] font-bold font-mono">{timeStr}</span>
            </div>

            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Party Size</span>
              <p className="font-extrabold text-[#071A3D] dark:text-white">
                {pax} Guests (Pax)
              </p>
            </div>

            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase block">Location / Table</span>
              <p className="font-extrabold text-[#071A3D] dark:text-white truncate">
                {venue}
              </p>
            </div>
          </div>

          {/* Dedicated Assigned Table Indicator */}
          {reservation.table_number && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="material-icons text-base text-emerald-600">table_restaurant</span>
                <span>Assigned Dining Table:</span>
              </span>
              <span className="font-black text-emerald-900 dark:text-emerald-100 bg-white dark:bg-emerald-900/90 px-2.5 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-600 shadow-2xs">
                {reservation.table_number}
              </span>
            </div>
          )}

          {/* Security & Verification Notice */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Verified Jo's Diner Voucher</span>
            </span>
            <span className="font-mono">Single-Entry Protected</span>
          </div>
        </div>

        {/* Email QR to Gmail Section (Only for Confirmed Reservations) */}
        {status === 'Confirmed' && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="material-icons text-red-600 text-sm">mail</span>
                <span>Send QR Pass to Gmail</span>
              </span>
              {targetEmail && !showEmailInput ? (
                <button
                  type="button"
                  onClick={() => setShowEmailInput(true)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  Change Email
                </button>
              ) : null}
            </div>

            {showEmailInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-red-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmail}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  {isSendingEmail ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-icons text-xs">send</span>
                  )}
                  <span>Send</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                  {targetEmail}
                </span>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmail}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  {isSendingEmail ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-slate-700 dark:border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-icons text-xs text-red-600">send</span>
                  )}
                  <span>Email QR Pass</span>
                </button>
              </div>
            )}

            {emailStatus && (
              <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                emailStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}>
                <span className="material-icons text-xs">
                  {emailStatus === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{emailMessage}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {status === 'Confirmed' && (
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <span className="material-icons text-sm text-[#C8102E]">download</span>
              <span>Save QR Image</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 font-bold text-xs flex items-center justify-center gap-1 border border-gray-300 dark:border-slate-700 transition active:scale-95 cursor-pointer"
            title="Print Reservation Ticket"
          >
            <span className="material-icons text-sm">print</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 border border-red-700 transition active:scale-95 cursor-pointer"
            >
              <span>Done</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default ReservationQRPass
