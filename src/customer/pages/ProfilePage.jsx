import React, { useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import AuthModal from '../../components/AuthModal'

function ProfilePage(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const { showToast } = useToast()

  const isDarkMode = props.isDarkMode ?? context.isDarkMode
  const currentUser = props.currentUser ?? context.currentUser
  const onLoginSuccess = props.onLoginSuccess ?? context.handleLoginSuccess
  const onLogout = props.onLogout ?? context.handleLogout

  const [fullName, setFullName] = useState(currentUser?.full_name || currentUser?.username || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [address, setAddress] = useState(currentUser?.address || '')
  const [dietary, setDietary] = useState('No Special Restrictions')
  const [preferredHall, setPreferredHall] = useState('Standard Hall (50 Pax)')

  const [isSaved, setIsSaved] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const updatedUser = {
      ...currentUser,
      full_name: fullName,
      email,
      phone,
      address,
      dietary,
      preferredHall
    }
    if (onLoginSuccess) onLoginSuccess(updatedUser)
    try {
      localStorage.setItem('josdiner_customer_user', JSON.stringify(updatedUser))
    } catch (err) {}
    setIsSaved(true)
    if (showToast) showToast('Profile details updated successfully!', 'success')
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#040D21] text-white' : 'bg-[#F8FAFC] text-[#071A3D]'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header matching standard customer pages */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-300 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-[#C8102E] transition font-semibold cursor-pointer">Home</button>
              <span>/</span>
              <span className="text-[#C8102E]">My Profile</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="material-icons text-[#C8102E] text-3xl sm:text-4xl">account_circle</span>
              <span>Customer Account Profile</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Manage your personal information, primary delivery address, and dining preferences.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => navigate('/my-reservations')}
              className="bg-gray-100/80 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-white px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="material-icons text-base">calendar_month</span>
              <span>My Reservations</span>
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="bg-gray-100/80 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-white px-4 py-2.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="material-icons text-base">receipt_long</span>
              <span>My Orders</span>
            </button>
            {currentUser && (
              <button
                onClick={onLogout}
                className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-[#C8102E] px-4 py-2.5 rounded-md text-xs font-black shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span className="material-icons text-base">logout</span>
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Logged Out State View */}
        {!currentUser ? (
          <div className={`p-8 sm:p-12 rounded-lg border text-center space-y-4 max-w-lg mx-auto shadow-xs ${
            isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
          }`}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-slate-800 text-[#C8102E] flex items-center justify-center mx-auto text-3xl border border-red-100 dark:border-red-950">
              <span className="material-icons text-3xl">lock</span>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black">Account Login Required</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto font-medium">
                Please log in or register a new customer account to manage your profile, view orders, and manage hall reservations.
              </p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-6 py-2.5 rounded-md text-xs font-black transition shadow-xs inline-flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span className="material-icons text-sm">account_circle</span>
              <span>Log In / Register Now</span>
            </button>

            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              isDarkMode={isDarkMode}
              onLoginSuccess={onLoginSuccess}
            />
          </div>
        ) : (
          <>
            {/* Saved Success Alert */}
            {isSaved && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 shadow-2xs">
                <span className="material-icons text-base text-emerald-600">check_circle</span>
                <span>Profile information updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Account Card Banner (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className={`p-6 rounded-lg border text-center space-y-4 shadow-xs ${
                  isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
                }`}>
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="w-24 h-24 rounded-full bg-[#C8102E] text-white flex items-center justify-center text-3xl font-black uppercase shadow-md">
                      {fullName ? fullName.charAt(0) : 'U'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#071A3D] flex items-center justify-center text-white text-xs" title="Verified Customer">
                      <span className="material-icons text-xs">check</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#071A3D] dark:text-white">{fullName || 'Customer User'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{email}</p>
                    <span className="mt-2 inline-block px-3 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-50 dark:bg-red-950/50 text-[#C8102E] border border-red-200 dark:border-red-900">
                      Customer Account
                    </span>
                  </div>

                  {/* Summary Stats */}
                  <div className="pt-4 border-t border-gray-300 dark:border-slate-700 grid grid-cols-2 gap-2 text-center text-xs">
                    <div 
                      onClick={() => navigate('/my-reservations')}
                      className="p-2.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 cursor-pointer hover:border-gray-400 dark:hover:border-slate-600 transition"
                    >
                      <span className="block font-black text-base text-[#C8102E] font-mono">2</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Reservations</span>
                    </div>
                    <div 
                      onClick={() => navigate('/my-orders')}
                      className="p-2.5 rounded-md bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 cursor-pointer hover:border-gray-400 dark:hover:border-slate-600 transition"
                    >
                      <span className="block font-black text-base text-[#C8102E] font-mono">5</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Food Orders</span>
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="pt-3 border-t border-gray-300 dark:border-slate-700 space-y-1.5 text-left">
                    <button
                      onClick={() => navigate('/menu')}
                      className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons text-sm text-[#C8102E]">restaurant_menu</span>
                        <span>Browse Food Menu</span>
                      </span>
                      <span className="material-icons text-xs">chevron_right</span>
                    </button>
                    <button
                      onClick={() => navigate('/catering')}
                      className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons text-sm text-[#C8102E]">bento</span>
                        <span>Catering Packages</span>
                      </span>
                      <span className="material-icons text-xs">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Edit Profile Details Form (8 Cols) */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSaveProfile} className={`p-6 sm:p-7 rounded-lg border space-y-5 shadow-xs ${
                  isDarkMode ? 'bg-[#071A3D] border-slate-700 text-white' : 'bg-white border-gray-300 text-[#071A3D]'
                }`}>
                  <div className="border-b pb-3 border-gray-300 dark:border-slate-700 flex items-center gap-2">
                    <span className="material-icons text-[#C8102E]">edit</span>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">Edit Personal Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Dietary Preference
                      </label>
                      <select
                        value={dietary}
                        onChange={(e) => setDietary(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                      >
                        <option value="No Special Restrictions">No Special Restrictions</option>
                        <option value="Halal Friendly">Halal Friendly</option>
                        <option value="No Pork Dishes">No Pork Dishes</option>
                        <option value="Seafood Allergy">Seafood Allergy</option>
                        <option value="Vegetarian">Vegetarian</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Primary Catering / Event Venue Address
                    </label>
                    <textarea
                      rows="3"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter full address for event catering setup"
                      className={`w-full px-3 py-2 rounded-md border text-xs font-semibold focus:outline-none focus:border-[#C8102E] ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                      }`}
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-300 dark:border-slate-700">
                    <button
                      type="submit"
                      className="bg-[#C8102E] hover:bg-[#9B0B21] text-white px-5 py-2.5 rounded-md font-black text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-icons text-sm">save</span>
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default ProfilePage
