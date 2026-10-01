import React, { useState, useEffect } from 'react'
import logo from '../assets/logo.png'

// ============================================
// LOADING TIPS FOR BETTER UX
// ============================================

const LOADING_TIPS = [
  '🎨 Crafting delicious dishes...',
  '🍽️ Setting the table...',
  '👨‍🍳 Our chefs are preparing...',
  '🔥 Firing up the grill...',
  '🌿 Sourcing fresh ingredients...',
  '🍷 Decanting the finest wine...',
  '🎵 Playing some smooth jazz...',
  '✨ Adding the finishing touches...'
]

// ============================================
// MAIN LOADING FALLBACK COMPONENT
// ============================================

export const LoadingFallback = ({
  message = 'Loading Jo\'s Diner...',
  showTips = true,
  tipInterval = 3000,
  minDisplayTime = 1000,
  maxDisplayTime = 30000,
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  const [currentTip, setCurrentTip] = useState('')
  const [tipIndex, setTipIndex] = useState(0)
  const [show, setShow] = useState(false)
  const [progress, setProgress] = useState(0)

  // ============================================
  // TIP ROTATION
  // ============================================
  useEffect(() => {
    if (!showTips) return

    const tip = LOADING_TIPS[tipIndex % LOADING_TIPS.length]
    setCurrentTip(tip)

    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % LOADING_TIPS.length)
    }, tipInterval)

    return () => clearInterval(interval)
  }, [tipIndex, showTips, tipInterval])

  // ============================================
  // MINIMUM DISPLAY TIME (prevent flashing)
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true)
    }, 100)

    // Auto-close after max time (safety net)
    const timeout = setTimeout(() => {
      console.warn('⏰ LoadingFallback exceeded max display time')
      // Could trigger error recovery here
    }, maxDisplayTime)

    return () => {
      clearTimeout(timer)
      clearTimeout(timeout)
    }
  }, [maxDisplayTime])

  // ============================================
  // PROGRESS SIMULATION
  // ============================================
  useEffect(() => {
    let rafId
    let startTime = Date.now()
    const duration = 8000 // 8 seconds to complete

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 95) // Cap at 95%
      setProgress(newProgress)

      if (newProgress < 95) {
        rafId = requestAnimationFrame(updateProgress)
      }
    }

    rafId = requestAnimationFrame(updateProgress)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // ============================================
  // SIZE CONFIGURATION
  // ============================================
  const sizeConfig = {
    sm: {
      container: 'w-14 h-14',
      logo: 'w-7 h-7',
      border: 'border-[3px]',
      text: 'text-xs'
    },
    md: {
      container: 'w-20 h-20',
      logo: 'w-10 h-10',
      border: 'border-4',
      text: 'text-sm'
    },
    lg: {
      container: 'w-28 h-28',
      logo: 'w-14 h-14',
      border: 'border-[5px]',
      text: 'text-base'
    }
  }

  const config = sizeConfig[size] || sizeConfig.md

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-white/95 dark:bg-[#040D21]/95 backdrop-blur-sm transition-colors duration-200"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center max-w-sm w-full">

        {/* ========================================== */}
        {/* SPINNER WITH LOGO */}
        {/* ========================================== */}
        <div className="relative flex items-center justify-center">
          {/* Outer Spinning Ring */}
          <div
            className={`
              ${config.container} 
              rounded-full 
              ${config.border} 
              border-[#C8102E]/20 
              border-t-[#C8102E] 
              animate-spin
              transition-all duration-300
              will-change-transform
            `}
            style={{
              animationDuration: '1.2s',
              animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)'
            }}
          ></div>

          {/* Inner Ring (secondary) */}
          <div
            className={`
              absolute 
              ${config.container} 
              rounded-full 
              ${config.border} 
              border-[#071A3D]/10 
              border-b-[#071A3D] 
              animate-spin
              transition-all duration-300
              will-change-transform
            `}
            style={{
              animationDuration: '1.8s',
              animationDirection: 'reverse',
              animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)'
            }}
          ></div>

          {/* Jo's Diner Logo in Center */}
          <img
            src={logo}
            alt="Jo's Diner Logo"
            className={`
              ${config.logo} 
              object-contain 
              absolute 
              animate-pulse 
              drop-shadow-sm
              transition-all duration-300
            `}
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* ========================================== */}
        {/* LOADING MESSAGE */}
        {/* ========================================== */}
        <p className={`
          mt-5 
          font-black 
          ${config.text} 
          text-[#071A3D] 
          dark:text-slate-100 
          tracking-wider 
          uppercase
          animate-pulse
          transition-all duration-300
        `}>
          {message}
        </p>

        {/* ========================================== */}
        {/* LOADING TIPS */}
        {/* ========================================== */}
        {showTips && currentTip && (
          <p className={`
            mt-3 
            text-xs 
            font-medium 
            text-gray-500 
            dark:text-gray-400 
            transition-all duration-500 
            ${currentTip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
            text-center
            min-h-[24px]
          `}>
            {currentTip}
          </p>
        )}

        {/* ========================================== */}
        {/* PROGRESS BAR */}
        {/* ========================================== */}
        <div className="mt-6 w-full max-w-xs">
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C8102E] to-[#E8492E] rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                transition: 'width 0.3s cubic-bezier(0.65, 0, 0.35, 1)'
              }}
            />
          </div>
          <p className="mt-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 text-right">
            {Math.round(progress)}%
          </p>
        </div>

        {/* ========================================== */}
        {/* ESTIMATED TIME (optional) */}
        {/* ========================================== */}
        <p className="mt-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 text-center">
          ⏳ Please wait while we prepare your experience
        </p>
      </div>
    </div>
  )
}

// ============================================
// SKELETON LOADER (for content placeholders)
// ============================================

export const SkeletonLoader = ({
  type = 'grid', // 'grid' | 'list' | 'card' | 'table'
  count = 8,
  columns = 4
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'grid':
        return (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-4 p-4`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0A1A3A] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
                <div className="h-44 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className="max-w-sm mx-auto p-4 bg-white dark:bg-[#0A1A3A] rounded-2xl border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        )

      case 'list':
        return (
          <div className="space-y-3 p-4">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-[#0A1A3A] rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        )

      case 'table':
        return (
          <div className="p-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 flex gap-4 border-b border-gray-200 dark:border-gray-800">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                ))}
              </div>
              {[...Array(count)].map((_, i) => (
                <div key={i} className="p-3 flex gap-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return renderSkeleton()
}

// ============================================
// LAZY LOADING FALLBACK (for React.lazy)
// ============================================

export const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
        Loading page...
      </p>
    </div>
  </div>
)

// ============================================
// MINI LOADING SPINNER (for buttons, inline)
// ============================================

export const MiniSpinner = ({
  size = 'sm',
  color = 'currentColor',
  className = ''
}) => {
  const sizeMap = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-8 h-8 border-4'
  }

  return (
    <div
      className={`
        ${sizeMap[size]} 
        border-t-transparent 
        rounded-full 
        animate-spin 
        ${className}
      `}
      style={{ borderColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default LoadingFallback