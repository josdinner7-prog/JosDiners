import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import gcashIcon from '../assets/Gcash_icon.png'
import mayaIcon from '../assets/Maya_icon.png'
import counterPaymentIcon from '../assets/CounterPayment_icon.png'
import bankTransferIcon from '../assets/BankTransfer_icon.png'

const PAYMENT_DETAILS = {
  GCash: {
    title: 'GCash Payment Info',
    imgIcon: gcashIcon,
    color: 'bg-[#005CE6]',
    accountName: "Jo's Diner & Catering Services",
    accountNumber: '0910 379 3664',
    instructions: 'Send payment via GCash Express Send or scan QR at our diner counter. Please present your transaction reference upon pickup.',
  },
  Maya: {
    title: 'Maya Payment Info',
    imgIcon: mayaIcon,
    color: 'bg-emerald-600',
    accountName: "Jo's Diner Polomolok",
    accountNumber: '0910 379 3664',
    instructions: 'Pay directly via Maya App to our mobile number or scan our official merchant QR code at the counter.',
  },
  COD: {
    title: 'Cash Payment Info',
    imgIcon: counterPaymentIcon,
    color: 'bg-amber-600',
    accountName: "Pay at Diner Cashier Counter",
    accountNumber: 'Cash Payment Upon Pickup',
    instructions: 'Pay in cash directly to our cashier counter upon claiming your food tray order or when dining in.',
  },
  Bank: {
    title: 'Bank Transfer (BDO / BPI)',
    imgIcon: bankTransferIcon,
    color: 'bg-[#071A3D]',
    accountName: "Jo's Diner Function Hall & Catering",
    accountNumber: 'BDO: 0012-3456-7890 | BPI: 9876-5432-10',
    instructions: 'Transfer payment via online banking to BDO or BPI for catering packages & venue hall deposits. Send deposit slip to josdinner7@gmail.com.',
  },
}

function CustomerFooter({ onExploreMenu, onBookHall }) {
  const navigate = useNavigate()
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNav = (path) => {
    navigate(path)
    scrollToTop()
  }

  return (
    <footer className="relative bg-gradient-to-b from-[#071A3D] via-[#040D21] to-[#020714] text-white pt-10 pb-8 border-t border-slate-700 overflow-hidden">

      {/* Decorative Subtle Background Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C8102E]/10 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-8 md:px-10 lg:px-12 relative z-10">

        {/* Main Footer Links & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-12 pb-10 border-b border-slate-800">

          {/* Col 1: Brand Info & Socials (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Jo's Diner Logo"
                className="h-14 sm:h-16 w-auto object-contain filter drop-shadow"
              />
              <div>
                <span className="jos-diner-brand-title text-xl tracking-wide !text-white block">
                  JO'S DINER
                </span>
                <span className="text-[9px] font-extrabold text-[#F59E0B] tracking-wider uppercase block">
                  Function Hall & Catering Services
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">
                  Polomolok, South Cotabato
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
              Bringing authentic Philippine dining, solo bento meals, party trays, and full catering event packages straight to your table in South Cotabato.
            </p>

            {/* Social Action Pills */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Connect With Us</span>
              <div className="flex items-center gap-2">
                <a
                  href="tel:09103793664"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#C8102E] text-gray-300 hover:text-white border border-slate-700 flex items-center justify-center transition transform hover:-translate-y-0.5"
                  title="Call 0910 379 3664"
                >
                  <span className="material-icons text-base">phone</span>
                </a>
                <a
                  href="mailto:josdinner7@gmail.com"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#C8102E] text-gray-300 hover:text-white border border-slate-700 flex items-center justify-center transition transform hover:-translate-y-0.5"
                  title="Email josdinner7@gmail.com"
                >
                  <span className="material-icons text-base">email</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#C8102E] text-gray-300 hover:text-white border border-slate-700 flex items-center justify-center transition transform hover:-translate-y-0.5"
                  title="Facebook Page"
                >
                  <span className="material-icons text-base">public</span>
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#C8102E] text-gray-300 hover:text-white border border-slate-700 flex items-center justify-center transition transform hover:-translate-y-0.5"
                  title="Location Map"
                >
                  <span className="material-icons text-base">place</span>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#F59E0B]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <button
                  onClick={() => handleNav('/menu')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>Food Menu & Trays</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/budget-menu')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer text-amber-300 font-bold"
                >
                  <span className="material-icons text-[14px] text-amber-400 group-hover:translate-x-0.5 transition">auto_awesome</span>
                  <span>AI Budget Menu Planner</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/catering')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>Catering Packages</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/function-halls')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>Function Hall Booking</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/my-orders')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>My Orders & History</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/my-reservations')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>My Table Reservations</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/my-events')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>My Events & Catering</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/reservation')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-icons text-[14px] text-[#C8102E] group-hover:translate-x-0.5 transition">chevron_right</span>
                  <span>Book a Table</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/download')}
                  className="hover:text-white transition flex items-center gap-1.5 group cursor-pointer text-emerald-400 font-bold"
                >
                  <span className="material-icons text-[14px] text-emerald-400 group-hover:translate-x-0.5 transition">android</span>
                  <span>Get Android App</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Store Operating Hours Card (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#F59E0B]">
              Operating Hours
            </h4>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Daily Schedule:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Open Daily</span>
                </span>
              </div>

              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span className="material-icons text-base text-[#F59E0B]">schedule</span>
                <span>9:00 AM – 8:30 PM</span>
              </div>

              <p className="text-[11px] text-gray-400 leading-tight pt-1 border-t border-slate-800/80 flex items-start gap-1">
                <span className="material-icons text-xs text-[#F59E0B] shrink-0 mt-0.5">info</span>
                <span>Function Hall bookings and event reservations available by appointment.</span>
              </p>
            </div>
          </div>

          {/* Col 4: Contact & Location Info (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#F59E0B]">
              Main Branch Contact
            </h4>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <span className="material-icons text-base text-[#F59E0B] shrink-0 mt-0.5">location_on</span>
                <div>
                  <strong className="text-white block font-bold mb-0.5">Diner & Function Hall Address:</strong>
                  <span>Lerio Street, corner Cadena de Amor, Polomolok, South Cotabato</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1 border-t border-slate-800/80">
                <span className="material-icons text-base text-[#F59E0B] shrink-0">phone</span>
                <a href="tel:09103793664" className="hover:text-white transition font-bold text-white">
                  0910 379 3664
                </a>
              </div>

              <div className="flex items-center gap-2.5 pt-1 border-t border-slate-800/80">
                <span className="material-icons text-base text-[#F59E0B] shrink-0">email</span>
                <a href="mailto:josdinner7@gmail.com" className="hover:text-white transition font-semibold text-gray-200 truncate">
                  josdinner7@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Android App Download Banner */}
        <div className="mb-8 bg-gradient-to-r from-[#071A3D] via-slate-900 to-[#071A3D] border border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="material-icons text-emerald-400 text-2xl">android</span>
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight">Get the Jo's Diner App</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Order faster, track deliveries & reserve halls right from your Android phone.</p>
            </div>
          </div>
          <button
            onClick={() => handleNav('/download')}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <span className="material-icons text-base">download</span>
            <span>Download Free APK</span>
          </button>
        </div>

        {/* Bottom Bar: Copyright & Payment Method Asset Icons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Jo's Diner Function Hall & Catering Services. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold">Payment Methods:</span>

            <button
              onClick={() => setSelectedPayment(PAYMENT_DETAILS.GCash)}
              className="bg-slate-800/90 hover:bg-[#005CE6] border border-slate-700/80 hover:border-blue-400 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-xs transition transform hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Click to view GCash Payment Details"
            >
              <img src={gcashIcon} alt="GCash" className="h-4 w-auto object-contain rounded-xs" />
              <span>GCash</span>
            </button>

            <button
              onClick={() => setSelectedPayment(PAYMENT_DETAILS.Maya)}
              className="bg-slate-800/90 hover:bg-emerald-600 border border-slate-700/80 hover:border-emerald-400 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-xs transition transform hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Click to view Maya Payment Details"
            >
              <img src={mayaIcon} alt="Maya" className="h-4 w-auto object-contain rounded-xs" />
              <span>Maya</span>
            </button>

            <button
              onClick={() => setSelectedPayment(PAYMENT_DETAILS.COD)}
              className="bg-slate-800/90 hover:bg-amber-600 border border-slate-700/80 hover:border-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-xs transition transform hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Click to view Cash Payment Info"
            >
              <img src={counterPaymentIcon} alt="Cash" className="h-4 w-auto object-contain rounded-xs" />
              <span>Cash Payment</span>
            </button>

            <button
              onClick={() => setSelectedPayment(PAYMENT_DETAILS.Bank)}
              className="bg-slate-800/90 hover:bg-[#C8102E] border border-slate-700/80 hover:border-red-400 px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-xs transition transform hover:-translate-y-0.5 flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Click to view Bank Transfer Details"
            >
              <img src={bankTransferIcon} alt="Bank Transfer" className="h-4 w-auto object-contain rounded-xs" />
              <span>Bank Transfer</span>
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Payment Info Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white text-[#071A3D] border border-gray-300 rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-7 h-7 rounded-full flex items-center justify-center transition hover:bg-gray-100"
            >
              <span className="material-icons text-lg">close</span>
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <img src={selectedPayment.imgIcon} alt={selectedPayment.title} className="h-11 sm:h-12 w-auto object-contain shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-[#071A3D]">{selectedPayment.title}</h3>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Jo's Diner Official Payment Channel</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3.5 space-y-2.5 text-xs text-gray-700 mb-4">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Account Name:</span>
                <strong className="text-[#071A3D] text-sm font-extrabold">{selectedPayment.accountName}</strong>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Account / Reference Details:</span>
                <strong className="text-[#C8102E] text-sm tracking-wide font-mono block mt-0.5 font-bold">{selectedPayment.accountNumber}</strong>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Payment Instructions:</span>
                <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{selectedPayment.instructions}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPayment(null)}
              className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-2 rounded-lg text-xs font-extrabold shadow transition active:scale-95"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Floating System-Wide Back-to-Top Button (Stacked above AI Concierge button) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 sm:bottom-22 sm:right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900/90 dark:bg-slate-800/95 hover:bg-[#C8102E] dark:hover:bg-[#C8102E] text-white shadow-xl backdrop-blur-md flex items-center justify-center border border-white/20 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-bottom-3"
          title="Back to Top"
        >
          <span className="material-icons text-lg sm:text-xl font-bold">arrow_upward</span>
        </button>
      )}

    </footer>
  )
}

export default CustomerFooter
