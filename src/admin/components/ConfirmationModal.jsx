import React, { useEffect } from 'react'
import confirmationDeleteIcon from '../../assets/ConfirmationDelete_icon.png'
import logoutIcon from '../../assets/Logout_icon.png'

/**
 * Reusable Confirmation Modal for Admin Actions (Delete, Logout, Deactivate, Status Change, etc.)
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {() => void} onClose - Callback when cancelling / closing
 * @param {() => void} onConfirm - Callback when user confirms action
 * @param {string} title - Modal heading title
 * @param {string|React.ReactNode} message - Detailed warning or explanation
 * @param {string} confirmText - Label on the confirmation button (e.g. "Delete Venue", "Log Out", "Yes, Proceed")
 * @param {string} cancelText - Label on cancel button (default: "Cancel")
 * @param {'danger' | 'logout' | 'warning' | 'info' | 'success'} variant - Visual tone of the modal
 * @param {string} icon - Material-icons icon name or custom image
 * @param {string} image - Custom image source override
 * @param {boolean} isLoading - Shows spinner on confirm button if async operation is running
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  image,
  isLoading = false
}) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  // Variant themes
  const variantStyles = {
    danger: {
      confirmBtn: 'bg-[#C8102E] hover:bg-[#9B0B21] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-red-300'
    },
    logout: {
      confirmBtn: 'bg-[#C8102E] hover:bg-[#9B0B21] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-red-300'
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50 border border-amber-200',
      iconName: icon || 'warning_amber',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-amber-300'
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50 border border-blue-200',
      iconName: icon || 'info',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-blue-300'
    },
    success: {
      iconBg: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 border border-emerald-200',
      iconName: icon || 'check_circle',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-emerald-300'
    }
  }

  const currentTheme = variantStyles[variant] || variantStyles.danger

  // Determine hero illustration
  const resolvedImage = image || (
    variant === 'logout'
      ? logoutIcon
      : variant === 'danger' && !icon
      ? confirmationDeleteIcon
      : null
  )

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose()
        }
      }}
    >
      <div className="relative bg-white rounded-lg max-w-[400px] sm:max-w-[430px] w-full p-6 sm:p-7 shadow-2xl border border-gray-400 text-center space-y-4 my-auto animate-in zoom-in-95 duration-150 text-[#071A3D]">
        
        {/* Top Dismiss Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer active:scale-95 disabled:opacity-50"
          title="Close dialog"
        >
          <span className="material-icons text-sm">close</span>
        </button>

        {/* Hero Illustration / Icon */}
        <div className="pt-1 flex justify-center">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt="Confirmation illustration"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xs select-none pointer-events-none"
            />
          ) : (
            <div className={`w-14 h-14 rounded-lg mx-auto flex items-center justify-center ${currentTheme.iconBg}`}>
              <span className="material-icons text-3xl">{currentTheme.iconName}</span>
            </div>
          )}
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-[#071A3D]">
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-xs sm:max-w-sm mx-auto">
            {message}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="h-11 px-4 rounded-md border border-gray-400 bg-white hover:bg-gray-100 text-gray-700 font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-11 px-4 rounded-md font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 ${currentTheme.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
