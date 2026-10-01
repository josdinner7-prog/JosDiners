import { useState } from 'react'
import { api } from '../services/api'

/**
 * SMSModal – A system-standard SMS sender modal for Admin & Staff portals
 * Props:
 *   onClose: fn
 *   defaultNumber: string (pre-fill from reservation/customer data)
 *   defaultMessage: string (pre-fill from notification context)
 */
export default function SMSModal({ onClose, defaultNumber = '', defaultMessage = '' }) {
  const [number, setNumber] = useState(defaultNumber)
  const [message, setMessage] = useState(defaultMessage)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const charCount = message.length
  const smsSegments = Math.ceil(charCount / 160) || 1

  // Normalise Philippine number to +639XXXXXXXXX before sending
  const normaliseNumber = (raw) => {
    let n = raw.replace(/[\s\-]/g, '')
    if (n.startsWith('+63')) return n
    if (n.startsWith('09') && n.length === 11) return '+63' + n.slice(1)
    if (n.startsWith('9') && n.length === 10) return '+63' + n
    return n // pass through — backend will validate
  }

  const handleSend = async () => {
    if (!number.trim() || !message.trim()) return
    setSending(true)
    setResult(null)
    const normalisedNumber = normaliseNumber(number.trim())
    try {
      const res = await api.sms.send(message, normalisedNumber)
      setResult({ success: true, text: res.message || 'SMS sent successfully!' })
    } catch (err) {
      setResult({ success: false, text: err.message || 'Failed to send SMS.' })
    } finally {
      setSending(false)
    }
  }

  const templates = [
    { label: 'Approved', icon: 'check_circle', color: 'text-emerald-500', msg: "Good news! Your reservation at Jo's Diner has been approved. We look forward to serving you!" },
    { label: 'Reminder', icon: 'alarm', color: 'text-amber-500', msg: "Reminder: Your reservation at Jo's Diner is coming up. Please bring your QR code for check-in." },
    { label: 'Cancelled', icon: 'cancel', color: 'text-rose-500', msg: "We regret to inform you that your reservation at Jo's Diner has been cancelled. Contact us for more info." },
    { label: 'Payment', icon: 'payments', color: 'text-blue-500', msg: "Payment received for your reservation at Jo's Diner. Thank you! Your booking is now confirmed." },
    { label: 'Welcome', icon: 'celebration', color: 'text-purple-500', msg: "Welcome to Jo's Diner! Your reservation is confirmed. See you soon!" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#071A3D] rounded-xl border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <span className="material-icons text-xl">sms</span>
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#071A3D] dark:text-white">
                Send SMS Notification
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                CapCom SMS Gateway · Real-time Customer SMS Dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Phone Number Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-1">
              <span className="material-icons text-xs text-[#C8102E]">phone</span>
              <span>Recipient Phone Number</span>
            </label>
            <input
              type="tel"
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="+639XXXXXXXXX or 09XXXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-1">
                <span className="material-icons text-xs text-[#C8102E]">chat</span>
                <span>SMS Content</span>
              </label>
              <span className={`text-[10px] font-mono font-bold ${charCount > 160 ? 'text-red-500' : 'text-gray-400 dark:text-gray-400'}`}>
                {charCount}/160 · {smsSegments} segment{smsSegments > 1 ? 's' : ''}
              </span>
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your SMS message here..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition leading-relaxed"
            />
          </div>

          {/* Quick Templates */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-1">
              <span className="material-icons text-xs text-amber-500">bolt</span>
              <span>Quick Templates</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(t.msg)}
                  className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-[10.5px] transition cursor-pointer flex items-center gap-1"
                  title={t.msg}
                >
                  <span className={`material-icons text-xs ${t.color}`}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border ${
              result.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900'
            }`}>
              <span className="material-icons text-base">{result.success ? 'check_circle' : 'error'}</span>
              <span>{result.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-gray-50/80 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !number.trim() || !message.trim()}
            className={`px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              sending || !number.trim() || !message.trim()
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-slate-700'
                : 'bg-[#C8102E] hover:bg-[#9B0B21] text-white'
            }`}
          >
            <span className="material-icons text-sm">{sending ? 'hourglass_top' : 'send'}</span>
            <span>{sending ? 'Sending...' : 'Send SMS'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
