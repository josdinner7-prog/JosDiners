import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useToast } from '../components/ToastNotification'
import { useAuth } from './AuthContext'
import api from '../services/api'

function RoleLogin({ onLoginSuccess, onSwitchToCustomer }) {
  const { showToast } = useToast()
  const { loginStaff } = useAuth()
  const navigate = useNavigate()

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReturnToCustomer = () => {
    if (onSwitchToCustomer) onSwitchToCustomer()
    navigate('/')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await api.auth.staffLogin({ username, password })
      setLoading(false)

      if (data.status === 'success') {
        const userObj = data.user
        loginStaff(userObj)
        showToast(`Login successful! Welcome back, ${userObj.full_name || userObj.username}!`, 'success')
        if (onLoginSuccess) onLoginSuccess(userObj)

        const role = String(userObj.role || '').toLowerCase().trim()
        if (role === 'admin') {
          navigate('/admin', { replace: true })
        } else if (role === 'kitchen' || role === 'chef') {
          navigate('/kitchen', { replace: true })
        } else if (role === 'rider') {
          navigate('/rider', { replace: true })
        } else {
          navigate('/staff', { replace: true })
        }
      }
    } catch (err) {
      setLoading(false)
      const errorMsg = err.data?.message || err.message || 'Could not connect to backend server. Make sure Node server is running.'
      showToast(errorMsg, 'error')
    }
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 relative ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      
      {/* Top Responsive Header Bar - Hidden on mobile responsive view */}
      <header className={`hidden sm:block border-b py-2 sm:py-2.5 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#071A3D] border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          <button
            onClick={handleReturnToCustomer}
            className={`text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border active:scale-95 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700 text-gray-300 hover:text-white'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-[#C8102E]'
            }`}
          >
            <span className="material-icons text-sm sm:text-base text-[#C8102E]">storefront</span>
            <span className="hidden xs:inline">Return to </span><span>Customer Website</span>
          </button>

          {/* Interactive Night / Light Mode Switcher Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border transition active:scale-95 ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-[#F59E0B] hover:bg-slate-800' 
                : 'bg-gray-50 border-gray-200 text-[#071A3D] hover:bg-gray-100'
            }`}
            title="Toggle Night / Light Mode"
          >
            <span className="material-icons text-sm sm:text-base">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{isDarkMode ? 'Light Mode' : 'Night Mode'}</span>
          </button>
        </div>
      </header>

      {/* Responsive Main Section */}
      <section className="py-4 sm:py-8 md:py-12 my-auto px-2 sm:px-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Logo Showcase (Hidden on Mobile/Tablet responsive view, shown on Desktop lg+) */}
            <div className="hidden lg:flex lg:col-span-6 justify-center items-center order-2 lg:order-1 pt-4 lg:pt-0">
              <div className="relative lg:w-[380px] lg:h-[380px] flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Jo's Diner Logo" 
                  className="w-full h-full object-contain filter drop-shadow-xl transform hover:scale-105 transition duration-300"
                />
              </div>
            </div>

            {/* Right Column: Responsive Sleeker Form */}
            <div className="w-full lg:col-span-6 space-y-4 sm:space-y-5 order-1 lg:order-2 text-center lg:text-left max-w-lg mx-auto lg:max-w-none">
              
              <div>
                <span className="text-[10px] font-extrabold text-[#C8102E] uppercase tracking-wider block mb-1">
                  INTERNAL WORKSPACE LOGIN
                </span>

                <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
                  isDarkMode ? 'text-white' : 'text-[#071A3D]'
                }`}>
                  Authorized Workspace <br className="hidden sm:inline" />
                  <span className="text-[#C8102E]">Sign In to Jo's Diner</span>
                </h1>

                <p className={`text-xs sm:text-sm max-w-md mx-auto lg:mx-0 font-medium leading-relaxed mt-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Log in to access your assigned workspace (Management Analytics, Kitchen Display Queue, or Counter POS).
                </p>
              </div>

              {/* Form Container (Centered on Mobile / Aligned Left on Desktop) */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 max-w-md mx-auto lg:mx-0 text-left">
                
                {/* Username Input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${
                    isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                  }`}>
                    Username or Employee ID
                  </label>
                  <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm border flex items-center gap-2.5 transition ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/20' 
                      : 'bg-white border-gray-200 focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/10'
                  }`}>
                    <span className="material-icons text-[#C8102E] text-base sm:text-lg pl-1">badge</span>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="e.g. admin, kitchen, staff"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full py-1 bg-transparent text-xs font-semibold focus:outline-none placeholder-gray-400 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-xs font-bold ${
                      isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                      Account Password
                    </label>
                    
                    {/* IT Support Password Recovery Link */}
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(true)}
                      className="text-[11px] sm:text-xs font-bold text-[#C8102E] hover:underline flex items-center gap-0.5 transition"
                    >
                      <span className="material-icons text-xs">help_outline</span>
                      <span>Need help signing in?</span>
                    </button>
                  </div>

                  <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm border flex items-center gap-2.5 transition ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/20' 
                      : 'bg-white border-gray-200 focus-within:border-[#C8102E] focus-within:ring-2 focus-within:ring-[#C8102E]/10'
                  }`}>
                    <span className="material-icons text-[#C8102E] text-base sm:text-lg pl-1">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full py-1 bg-transparent text-xs font-semibold focus:outline-none placeholder-gray-400 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-1 text-gray-400 hover:text-gray-300 transition"
                    >
                      <span className="material-icons text-base">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-60 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="material-icons text-base animate-spin">sync</span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <span className="material-icons text-base">arrow_forward</span>
                    </>
                  )}
                </button>

              </form>

            </div>

          </div>
        </div>
      </section>

      {/* IT Support Contact Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border transition-all duration-300 transform animate-in fade-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-200 text-[#071A3D]'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-[#C8102E] flex items-center justify-center shrink-0">
                  <span className="material-icons text-xl">headset_mic</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">IT Support Helpdesk</h3>
                  <p className="text-xs text-gray-400">Account Recovery & Credential Assistance</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition p-1"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3.5 text-xs">
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                For security reasons, password resets and account creations are managed by the internal IT Administrator.
              </p>

              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="material-icons text-[#C8102E] text-base">phone_in_talk</span>
                  <div>
                    <strong className="block font-bold">IT Support Hotline:</strong>
                    <span className="text-gray-400">(02) 8923-4567 (Ext. 104)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t pt-2.5 border-gray-200 dark:border-slate-800">
                  <span className="material-icons text-[#C8102E] text-base">email</span>
                  <div>
                    <strong className="block font-bold">IT Administrator Email:</strong>
                    <span className="text-gray-400">itsupport@josdiner.com.ph</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t pt-2.5 border-gray-200 dark:border-slate-800">
                  <span className="material-icons text-[#C8102E] text-base">schedule</span>
                  <div>
                    <strong className="block font-bold">Helpdesk Operating Hours:</strong>
                    <span className="text-gray-400">7:00 AM - 10:00 PM (Mon - Sun)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsSupportModalOpen(false)}
              className="w-full mt-6 py-3 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95"
            >
              Close Helpdesk Info
            </button>

          </div>
        </div>
      )}

      {/* Footer Copyright */}
      <footer className={`border-t py-2 sm:py-2.5 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#071A3D]/70 border-slate-800/60 text-slate-400' : 'bg-white/80 border-gray-200/80 text-gray-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[9px] sm:text-[10px] tracking-tight font-medium">
            &copy; {new Date().getFullYear()} Jo's Diner<span className="hidden sm:inline"> Function Hall & Catering Services</span>. All rights reserved.
          </p>
        </div>
      </footer>


    </div>
  )
}

export default RoleLogin
