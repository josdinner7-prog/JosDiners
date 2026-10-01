import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function RiderProfilePage() {
  const {
    riderData,
    fetchRiderData,
    handleLogout
  } = useOutletContext()

  const { showToast } = useToast()

  const riderId = riderData?.user_id || riderData?.rider_id

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(riderData?.full_name || '')
  const [phone, setPhone] = useState(riderData?.phone_number || '')
  const [vehicle, setVehicle] = useState(riderData?.vehicle_type || 'Motorcycle')
  const [plate, setPlate] = useState(riderData?.plate_number || '')
  const [isSaving, setIsSaving] = useState(false)

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPass, setIsChangingPass] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await api.riders.updateProfile(riderId, {
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        vehicle_type: vehicle.trim(),
        plate_number: plate.trim()
      })
      if (res.status === 'success') {
        showToast('Rider profile updated successfully!', 'success')
        await fetchRiderData()
        setIsEditing(false)
      }
    } catch (err) {
      showToast(err.message || 'Could not update profile.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error')
      return
    }

    setIsChangingPass(true)
    try {
      const res = await api.riders.changePassword(riderId, {
        current_password: currentPassword,
        new_password: newPassword
      })
      if (res.status === 'success') {
        showToast('Password changed successfully!', 'success')
        setIsPasswordModalOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error')
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-2">
        <h2 className="text-lg font-black text-[#071A3D] flex items-center gap-2">
          <span className="material-icons text-blue-500">person</span>
          <span>Rider Profile</span>
        </h2>
        <p className="text-xs text-slate-400">
          Account details, assigned vehicle, and security credentials
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 text-center">
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#C8102E] to-amber-500 p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#071A3D] font-black text-2xl">
              {riderData?.full_name ? riderData.full_name.charAt(0).toUpperCase() : 'R'}
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Verified Courier Account" />
        </div>

        <div>
          <h3 className="text-base font-black text-[#071A3D]">
            {riderData?.full_name || 'Rider Account'}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {riderData?.employee_code || `RIDER-${riderId}`} • {riderData?.title || 'Courier Driver'}
          </span>
          <div className="pt-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
              riderData?.rider_status === 'Delivering'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : riderData?.rider_status === 'Available'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              ● {riderData?.rider_status || 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Information Details Card / Edit Form */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Vehicle & Logistics Information
          </span>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setFullName(riderData?.full_name || '')
                setPhone(riderData?.phone_number || '')
                setVehicle(riderData?.vehicle_type || 'Motorcycle')
                setPlate(riderData?.plate_number || '')
                setIsEditing(true)
              }}
              className="text-xs font-bold text-[#C8102E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-icons text-sm">edit</span>
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] font-bold focus:outline-none focus:border-[#C8102E]"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Mobile / Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] font-bold focus:outline-none focus:border-[#C8102E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Vehicle Info</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honda Beat 125cc"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] font-bold focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MC-1234-VR"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] font-mono font-bold focus:outline-none focus:border-[#C8102E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 rounded-lg bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-black shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5 text-xs divide-y divide-slate-100">
            <div className="flex justify-between items-center pt-1.5 first:pt-0">
              <span className="text-slate-400 font-medium">Username / Login ID:</span>
              <strong className="text-[#071A3D] font-mono">{riderData?.username}</strong>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-400 font-medium">Contact Phone:</span>
              <strong className="text-[#071A3D]">{riderData?.phone_number || 'Not Set'}</strong>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-400 font-medium">Delivery Vehicle:</span>
              <strong className="text-amber-600">{riderData?.vehicle_type || 'Motorcycle'}</strong>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-400 font-medium">Vehicle Plate #:</span>
              <strong className="text-[#071A3D] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {riderData?.plate_number || 'Pending'}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-400 font-medium">Account Role:</span>
              <span className="text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                Jo's Diner Official Courier
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Account Security & Actions */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-base text-amber-500">lock</span>
            <span>Change Account Password</span>
          </div>
          <span className="material-icons text-sm text-slate-400">chevron_right</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-base text-rose-500">logout</span>
            <span>Log Out from Rider App</span>
          </div>
          <span className="material-icons text-sm text-rose-400">exit_to_app</span>
        </button>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-[#071A3D] flex items-center gap-1.5">
                <span className="material-icons text-amber-500 text-base">lock</span>
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[#071A3D] focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="py-2.5 rounded-lg bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#a50d26] text-white font-black shadow-sm disabled:opacity-50"
                >
                  {isChangingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
