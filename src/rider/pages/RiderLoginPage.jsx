import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'
import logo from '../../assets/logo.png'

export default function RiderLoginPage() {
  const { loginStaff } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1: request, 2: verify & new pass
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await api.auth.staffLogin({ username, password })
      setLoading(false)

      if (data.status === 'success') {
        const userObj = data.user
        const role = String(userObj.role || '').toLowerCase().trim()

        if (role !== 'rider' && role !== 'admin') {
          showToast('This login portal is reserved for Delivery Riders.', 'warning')
          return
        }

        loginStaff(userObj)
        showToast(`Welcome back, Rider ${userObj.full_name || userObj.username}!`, 'success')
        navigate('/rider', { replace: true })
      }
    } catch (err) {
      setLoading(false)
      const errorMsg = err.data?.message || err.message || 'Invalid rider credentials. Please check your username and password.'
      showToast(errorMsg, 'error')
    }
  }

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setIsSendingOtp(true)
    try {
      await api.auth.forgotPassword(forgotEmail)
      showToast('Password reset code sent to your registered email.', 'success')
      setForgotStep(2)
    } catch (err) {
      showToast(err.message || 'Could not send reset code.', 'error')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setIsSendingOtp(true)
    try {
      await api.auth.resetPassword(forgotEmail, otpCode, newPassword)
      showToast('Password reset successfully! Please log in with your new password.', 'success')
      setIsForgotModalOpen(false)
      setForgotStep(1)
      setPassword('')
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error')
    } finally {
      setIsSendingOtp(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased p-4">
      
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold"
        >
          <span className="material-icons text-sm">arrow_back</span>
          <span>Customer Site</span>
        </Link>

        <Link
          to="/Rolelogin"
          className="text-xs text-[#C8102E] hover:underline font-bold"
        >
          Staff & Admin Portal
        </Link>
      </header>

      {/* Main Login Box */}
      <div className="max-w-sm w-full mx-auto space-y-6 my-auto">
        
        {/* Brand Showcase */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-2xl bg-[#071A3D] p-2.5 mx-auto border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            <img src={logo} alt="Jo's Diner" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-icons text-amber-400 text-lg">two_wheeler</span>
              <h1 className="text-xl font-black text-white tracking-tight">Rider Dispatch Portal</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in to manage deliveries, route orders, and log drop-offs
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4 text-xs font-semibold">
          
          <div>
            <label className="text-slate-300 font-bold block mb-1">Rider Username or Email</label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-slate-500 text-base pointer-events-none">
                person
              </span>
              <input
                type="text"
                required
                placeholder="e.g. rider_juan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-[#C8102E] transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-bold">Account Password</label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(true)
                  setForgotStep(1)
                }}
                className="text-[11px] text-[#C8102E] hover:underline font-bold cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-slate-500 text-base pointer-events-none">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-[#C8102E] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white cursor-pointer"
              >
                <span className="material-icons text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#b00d27] text-white font-black text-sm shadow-xl shadow-[#C8102E]/25 transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <span className="material-icons text-base">login</span>
            <span>{loading ? 'Authenticating...' : 'Sign In as Rider'}</span>
          </button>

          {/* Demo Credentials Reminder for Easy Testing */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-amber-400 block uppercase tracking-wider text-[9px]">Demo Rider Accounts:</span>
            <div className="font-mono text-slate-300">
              User: <strong className="text-white">rider_juan</strong> or <strong className="text-white">rider_mark</strong>
            </div>
            <div className="font-mono text-slate-300">
              Pass: <strong className="text-white">password123</strong>
            </div>
          </div>
        </form>

      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-600 max-w-sm mx-auto py-2">
        Jo's Diner Delivery Operations &copy; {new Date().getFullYear()}
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span className="material-icons text-amber-400 text-base">lock_reset</span>
                <span>Reset Rider Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <p className="text-slate-300">
                  Enter your registered email address. We will send you a 6-digit OTP verification code.
                </p>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Rider Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rider@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="py-2 px-4 rounded-xl bg-[#C8102E] hover:bg-[#a50d26] text-white font-black"
                  >
                    {isSendingOtp ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-slate-300">
                  Enter the 6-digit verification code sent to <strong className="text-white">{forgotEmail}</strong> and your new password.
                </p>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold tracking-widest text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                  >
                    {isSendingOtp ? 'Resetting...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
