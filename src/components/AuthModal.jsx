import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import forgotPassIcon from '../assets/ForgotPass_icon.png'
import otpIcon from '../assets/OTP_icon.png'
import newPassIcon from '../assets/Newpass_icon.png'
import { useToast } from './ToastNotification'
import api from '../services/api'

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}*@${domain}`
  const maskedUser = user[0] + '*'.repeat(Math.max(user.length - 2, 4)) + user[user.length - 1]
  return `${maskedUser}@${domain}`
}

function AuthModal({ isOpen, onClose, isDarkMode, onLoginSuccess }) {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('login')
  const [step, setStep] = useState('form')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')

  // Verification OTP Code State
  const [verifyEmail, setVerifyEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetOtpCode, setResetOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const resetAllFields = () => {
    setLoginEmail('')
    setLoginPassword('')
    setRegName('')
    setRegEmail('')
    setRegPhone('')
    setRegPassword('')
    setVerifyEmail('')
    setOtpCode('')
    setForgotEmail('')
    setResetOtpCode('')
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setLoading(false)
    setStep('form')
  }

  const handleClose = () => {
    resetAllFields()
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      resetAllFields()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Cooldown countdown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  if (!isOpen) return null

  const resetRegisterForm = () => {
    setRegName('')
    setRegEmail('')
    setRegPhone('')
    setRegPassword('')
  }

  // API Call to Node.js Express Customer Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    setLoginEmail(regEmail)
    setLoginPassword(regPassword)

    try {
      const data = await api.auth.register({
        full_name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      })

      setLoading(false)

      if (data.status === 'success') {
        setVerifyEmail(regEmail)
        setStep('verify')
        setResendCooldown(30)
        showToast('Verification code sent to your Gmail inbox!', 'info')
      } else {
        const msg = data.message || 'Registration failed. Please check your details.'
        showToast(msg, 'error')
        if (msg.includes('already registered')) {
          setActiveTab('login')
        }
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Could not connect to registration server.', 'error')
    }
  }

  // API Call to Resend Verification Code for Registration
  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setLoading(true)

    try {
      const data = await api.auth.resendCode(verifyEmail)
      setLoading(false)

      if (data.status === 'success') {
        setResendCooldown(30)
        showToast('New verification code sent to your Gmail!', 'success')
      } else {
        showToast(data.message || 'Failed to resend code.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Failed to connect to server.', 'error')
    }
  }

  // API Call to Resend OTP Code for Forgot Password
  const handleResendForgotOtpCode = async () => {
    if (resendCooldown > 0) return
    setLoading(true)

    try {
      const data = await api.auth.forgotPassword(forgotEmail)
      setLoading(false)

      if (data.status === 'success') {
        setResendCooldown(30)
        showToast('New password reset code sent to your Gmail inbox!', 'success')
      } else {
        showToast(data.message || 'Failed to resend code. Please try again.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Unable to connect to server. Please try again.', 'error')
    }
  }

  // API Call to Node.js Express Verify Email OTP
  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await api.auth.verifyEmail({
        email: verifyEmail,
        verification_code: otpCode,
      })

      setLoading(false)

      if (data.status === 'success') {
        const userObj = {
          full_name: regName || verifyEmail.split('@')[0],
          email: verifyEmail,
        }
        if (onLoginSuccess) onLoginSuccess(userObj)
        resetRegisterForm()
        showToast(`Email verified! Welcome to Jo's Diner, ${userObj.full_name}!`, 'success')
        onClose()
      } else {
        showToast(data.message || 'Invalid verification code. Please check your Gmail.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Could not connect to verification server. Please try again.', 'error')
    }
  }

  // API Call to Node.js Express Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await api.auth.login({
        email: loginEmail,
        password: loginPassword,
      })

      setLoading(false)

      if (data.status === 'success') {
        const userObj = data.user
        if (onLoginSuccess) onLoginSuccess(userObj)
        resetRegisterForm()
        showToast(`Login successful! Welcome back, ${userObj.full_name || 'Valued Guest'}!`, 'success')
        onClose()
      } else {
        showToast(data.message || 'Invalid email or password.', 'error')
      }
    } catch (err) {
      setLoading(false)
      if (err.data && err.data.is_unverified) {
        setVerifyEmail(err.data.email)
        setStep('verify')
        showToast('Your email is not verified yet. Enter code sent to Gmail.', 'warning')
      } else {
        showToast(err.message || 'Could not connect to authentication server.', 'error')
      }
    }
  }

  // Step 1 Forgot Password: Send OTP to Email
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      showToast('Please enter your registered email address.', 'error')
      return
    }
    setLoading(true)

    try {
      const data = await api.auth.forgotPassword(forgotEmail)
      setLoading(false)

      if (data.status === 'success') {
        setStep('forgot_otp')
        setResendCooldown(30)
        showToast(data.message || `Password reset code sent to ${maskEmail(forgotEmail)}!`, 'success')
      } else {
        showToast(data.message || 'No customer account found with this email.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Unable to connect to server. Please try again.', 'error')
    }
  }

  // Step 2 Forgot Password: Verify OTP Code First Before Password Reset
  const handleVerifyForgotOtpSubmit = async (e) => {
    e.preventDefault()
    if (resetOtpCode.length < 6) {
      showToast('Please enter the complete 6-digit verification code.', 'error')
      return
    }
    setLoading(true)

    try {
      const data = await api.auth.verifyResetCode({
        email: forgotEmail,
        reset_code: resetOtpCode,
      })

      setLoading(false)

      if (data.status === 'success') {
        setStep('forgot_reset')
        showToast(data.message || 'OTP Code Verified! Create your new password.', 'success')
      } else {
        showToast(data.message || 'Invalid or expired verification code.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast(err.message || 'Unable to connect to server. Please try again.', 'error')
    }
  }

  // Step 3 Forgot Password: Submit New Password & Update Database
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please re-check.', 'error')
      return
    }
    setLoading(true)

    try {
      const data = await api.auth.resetPassword({
        email: forgotEmail,
        reset_code: resetOtpCode,
        new_password: newPassword,
      })

      setLoading(false)

      if (data.status === 'success') {
        setLoginEmail(forgotEmail)
        setLoginPassword(newPassword)
        setStep('form')
        setActiveTab('login')
        showToast(data.message || 'Password updated successfully! Log in with your new password.', 'success')
      } else {
        showToast(data.message || 'Failed to update password.', 'error')
      }
    } catch (err) {
      setLoading(false)
      showToast('Unable to connect to server. Please try again.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
      <div className={`relative rounded-xl max-w-md w-full max-h-[92vh] overflow-y-auto scrollbar-thin shadow-2xl border transition-all duration-300 transform animate-in fade-in zoom-in-95 duration-200 ${isDarkMode
        ? 'bg-[#071A3D] border-slate-600 text-white'
        : 'bg-white border-gray-400 text-[#071A3D]'
        }`}>

        {/* Sleek Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center transition z-20 ${isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-slate-800'
            : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
            }`}
          title="Close Modal"
        >
          <span className="material-icons text-lg">close</span>
        </button>

        {/* FORGOT PASSWORD STEP 1: EMAIL INPUT */}
        {step === 'forgot_email' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto -mb-2 sm:-mb-3 flex items-center justify-center">
                <img src={forgotPassIcon} alt="Mailbox Icon" className="w-full h-full object-contain block" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Forgot Password?</h2>
              <p className={`text-xs max-w-xs mx-auto mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter your registered email address below and we'll send you a password reset code.
              </p>
            </div>

            <form onSubmit={handleForgotEmailSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                  }`}>
                  Registered Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">email</span>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="e.g. maria@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="material-icons text-base animate-spin">sync</span>
                    <span>Sending Reset Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Code</span>
                    <span className="material-icons text-base">send</span>
                  </>
                )}
              </button>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs text-gray-400 hover:text-gray-200 font-semibold"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD STEP 2: VERIFY OTP CODE WITH MASKED GMAIL & RESEND BUTTON */}
        {step === 'forgot_otp' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto -mb-3 sm:-mb-4 flex items-center justify-center">
                <img src={otpIcon} alt="OTP Phone Icon" className="w-full h-full object-contain block" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Enter Reset Code</h2>
              <p className={`text-xs max-w-xs mx-auto mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                We sent a 6-digit reset code to <strong className="text-[#C8102E]">{maskEmail(forgotEmail)}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyForgotOtpSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Enter 6-Digit Verification Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength="6"
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="123456"
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-center tracking-[10px] text-xl font-mono font-extrabold py-3 rounded-xl border focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                      }`}
                  />
                  {loading && (
                    <span className="material-icons animate-spin text-[#C8102E] absolute right-4 top-1/2 -translate-y-1/2 text-lg">
                      sync
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resetOtpCode.length < 6}
                className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="material-icons text-base animate-spin">sync</span>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Continue</span>
                    <span className="material-icons text-base">verified</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('forgot_email')}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-200 font-semibold disabled:opacity-50"
                >
                  ← Back to Email Input
                </button>

                <button
                  type="button"
                  onClick={handleResendForgotOtpCode}
                  disabled={loading || resendCooldown > 0}
                  className="text-[#C8102E] font-bold hover:text-[#9B0B21] disabled:opacity-50 inline-flex items-center gap-1 transition group"
                >
                  {loading && <span className="material-icons text-xs animate-spin shrink-0">sync</span>}
                  <span className="group-hover:underline">
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Email Code'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD STEP 3: NEW PASSWORD INPUT */}
        {step === 'forgot_reset' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto -mb-6 sm:-mb-8 flex items-center justify-center">
                <img src={newPassIcon} alt="New Password Shield Icon" className="w-full h-full object-contain block" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Set New Password</h2>
              <p className={`text-xs max-w-xs mx-auto mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Create your new account password below.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                  }`}>
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition ${isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition flex items-center justify-center"
                  >
                    <span className="material-icons text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                  }`}>
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock_clock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition ${isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                      }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="material-icons text-base animate-spin">sync</span>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password & Log In</span>
                    <span className="material-icons text-base">check_circle</span>
                  </>
                )}
              </button>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('forgot_otp')}
                  className="text-xs text-gray-400 hover:text-gray-200 font-semibold"
                >
                  ← Back to OTP Verification
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EMAIL VERIFICATION OTP CODE STEP FOR REGISTRATION WITH MASKED GMAIL */}
        {step === 'verify' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto -mb-3 sm:-mb-4 flex items-center justify-center">
                <img src={otpIcon} alt="OTP Phone Icon" className="w-full h-full object-contain block" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Verify Your Email</h2>
              <p className={`text-xs max-w-xs mx-auto mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                We sent a 6-digit verification code to <strong className="text-[#C8102E]">{maskEmail(verifyEmail)}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-bold mb-1.5 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Enter 6-Digit Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength="6"
                    required
                    disabled={loading}
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-center tracking-[10px] text-xl font-mono font-extrabold py-3 rounded-xl border focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                      }`}
                  />
                  {loading && (
                    <span className="material-icons animate-spin text-[#C8102E] absolute right-4 top-1/2 -translate-y-1/2 text-lg">
                      sync
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="material-icons text-base animate-spin">sync</span>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Activate Account</span>
                    <span className="material-icons text-base">verified</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-200 font-semibold disabled:opacity-50"
                >
                  ← Back to Registration
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || resendCooldown > 0}
                  className="text-[#C8102E] font-bold hover:text-[#9B0B21] disabled:opacity-50 inline-flex items-center gap-1 transition group"
                >
                  {loading && <span className="material-icons text-xs animate-spin shrink-0">sync</span>}
                  <span className="group-hover:underline">
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Email Code'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INITIAL LOGIN / REGISTER FORM STEP */}
        {step === 'form' && (
          <div className="p-6 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto scrollbar-none">

            {/* Brand Header Banner with Logo */}
            <div className="flex items-center gap-3 border-b pb-4 border-gray-200 dark:border-slate-700/80">
              <img src={logo} alt="Jo's Diner Logo" className="h-12 w-auto object-contain shrink-0" />
              <div className="flex flex-col justify-center leading-none">
                <span className="jos-diner-brand-title text-base sm:text-lg font-black block leading-none tracking-wide text-left">
                  JO'S DINER
                </span>
                <span className="text-[7.5px] font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mt-1">
                  CUSTOMER PORTAL ACCESS
                </span>
              </div>
            </div>


            {/* Login Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Email Address or Mobile Phone
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">email</span>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="e.g. maria@gmail.com or 09171234567"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    {loading && (
                      <span className="material-icons animate-spin text-[#C8102E] absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                        sync
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      placeholder="Enter your account password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition flex items-center justify-center"
                    >
                      <span className="material-icons text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-500 dark:text-gray-400 font-semibold">
                    <input type="checkbox" className="accent-[#C8102E] rounded" defaultChecked />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail)
                      setStep('forgot_email')
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="material-icons text-base animate-spin">sync</span>
                      <span>Logging In...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In to Account</span>
                      <span className="material-icons text-base">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="text-center -mt-1 sm:-mt-0.5 text-xs">
                  <span className={isDarkMode ? 'text-gray-300 font-medium' : 'text-gray-600 font-medium'}>
                    Don't have an account?{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-extrabold hover:underline transition"
                  >
                    Register Here
                  </button>
                </div>

              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-1">

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">badge</span>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder="e.g. Maria Santos"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    {loading && (
                      <span className="material-icons animate-spin text-[#C8102E] absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                        sync
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Email Address (Gmail)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">email</span>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      placeholder="e.g. maria@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    {loading && (
                      <span className="material-icons animate-spin text-[#C8102E] absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                        sync
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Mobile Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">phone_iphone</span>
                    <input
                      type="tel"
                      required
                      disabled={loading}
                      placeholder="0917 123 4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    {loading && (
                      <span className="material-icons animate-spin text-[#C8102E] absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                        sync
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-[#071A3D]'
                    }`}>
                    Create Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition disabled:opacity-60 ${isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                        }`}
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition flex items-center justify-center"
                    >
                      <span className="material-icons text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C8102E] hover:bg-[#9B0B21] text-white py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="material-icons text-base animate-spin">sync</span>
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Send Verification</span>
                      <span className="material-icons text-base">mark_email_read</span>
                    </>
                  )}
                </button>

                <div className="text-center -mt-1 sm:-mt-0.5 text-xs">
                  <span className={isDarkMode ? 'text-gray-300 font-medium' : 'text-gray-600 font-medium'}>
                    Already have an account?{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-extrabold hover:underline transition"
                  >
                    Log In
                  </button>
                </div>

              </form>
            )}

            {/* Quick Social Access Divider */}
            <div className="pt-0.5">
              <div className="relative flex py-1 items-center">
                <div className={`flex-grow border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}></div>
                <span className={`flex-shrink mx-2.5 text-[10px] font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  or continue with
                </span>
                <div className={`flex-grow border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const userObj = { full_name: "Google User", email: "user@gmail.com" }
                    if (onLoginSuccess) onLoginSuccess(userObj)
                    resetRegisterForm()
                    showToast("Signed in with Google!", "success")
                    onClose()
                  }}
                  className={`py-1 px-2 rounded-md border text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 transition hover:-translate-y-0.5 disabled:opacity-50 ${isDarkMode
                    ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800'
                    }`}
                >
                  <span className="font-black text-[#C8102E] text-xs">G</span>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const userObj = { full_name: "Facebook User", email: "user@facebook.com" }
                    if (onLoginSuccess) onLoginSuccess(userObj)
                    resetRegisterForm()
                    showToast("Signed in with Facebook!", "success")
                    onClose()
                  }}
                  className={`py-1 px-2 rounded-md border text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 transition hover:-translate-y-0.5 disabled:opacity-50 ${isDarkMode
                    ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800'
                    }`}
                >
                  <span className="font-black text-blue-600 text-xs">f</span>
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-gray-400 mt-3 leading-tight">
              By continuing, you agree to Jo's Diner <a href="#" onClick={(e) => e.preventDefault()} className="text-[#C8102E] hover:underline">Terms of Service</a> & <a href="#" onClick={(e) => e.preventDefault()} className="text-[#C8102E] hover:underline">Privacy Policy</a>.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default AuthModal
