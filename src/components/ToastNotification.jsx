import { useState, useEffect, createContext, useContext } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container Floating Overlay - Fully Responsive for Mobile & Desktop */}
      <div className="fixed top-4 sm:top-20 inset-x-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 sm:gap-2.5 max-w-md sm:max-w-sm w-auto sm:w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-3 sm:p-3.5 shadow-2xl border flex items-center justify-between gap-2.5 sm:gap-3 transform animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-100 border-emerald-700/80 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 text-red-100 border-red-800/80 shadow-red-950/50'
                : toast.type === 'info'
                ? 'bg-blue-950/95 text-blue-100 border-blue-800/80 shadow-blue-950/50'
                : 'bg-amber-950/95 text-amber-100 border-amber-800/80 shadow-amber-950/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="material-icons text-lg sm:text-xl shrink-0">
                {toast.type === 'success'
                  ? 'check_circle'
                  : toast.type === 'error'
                  ? 'error'
                  : toast.type === 'info'
                  ? 'info'
                  : 'warning'}
              </span>
              <p className="text-xs font-bold leading-snug break-words flex-1">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs font-bold opacity-70 hover:opacity-100 transition shrink-0 ml-1 p-1"
              aria-label="Dismiss toast notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
