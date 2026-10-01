import React from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPrompt({
  title = 'Please Log In to View Your Account',
  description = 'You need to be logged into a customer account to view and manage your bookings, orders, and notifications.',
  icon = 'lock',
  isDarkMode = false
}) {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    // Fire a custom event so CustomerHeader opens its AuthModal
    window.dispatchEvent(new CustomEvent('openAuthModal'))
  }

  return (
    <div className={`text-center py-16 px-6 rounded-xl border max-w-lg mx-auto shadow-sm my-8 transition-colors ${
      isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
    }`}>
      <div className="w-16 h-16 rounded-2xl bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center mx-auto mb-5 shadow-xs">
        <span className="material-icons text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl sm:text-2xl font-black mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleLoginClick}
          className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-icons text-base">login</span>
          <span>Log In / Register</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
        >
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  )
}

export default LoginPrompt
