import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../services/api'
import { useToast } from './ToastNotification'

function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } else if (type === 'warning') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } else {
      osc.type = 'square'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch (e) {
    // AudioContext not allowed or not supported, ignore silently
  }
}

function QRScannerModal({ isOpen, onClose, staffUser, onCheckInSuccess, isDarkMode = false }) {
  const { showToast } = useToast()
  const [activeMode, setActiveMode] = useState('camera') // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [scannedResult, setScannedResult] = useState(null)

  const scannerRef = useRef(null)
  const manualInputRef = useRef(null)
  const isStoppingRef = useRef(false)
  const isProcessingRef = useRef(false)

  const staffName = staffUser?.full_name || staffUser?.name || staffUser?.username || 'Staff Front Counter'

  // Initialize camera scanner when modal opens and camera mode is active
  useEffect(() => {
    if (!isOpen || activeMode !== 'camera') {
      stopCameraScanner()
      return
    }

    let isMounted = true

    const startScanner = async () => {
      setCameraError(null)
      try {
        // Small delay to ensure DOM container is rendered
        await new Promise((r) => setTimeout(r, 200))
        if (!isMounted) return

        const qrContainer = document.getElementById('jos-qr-reader-target')
        if (!qrContainer) return

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('jos-qr-reader-target')
        }

        // Query available camera devices for optimal matching on laptops and mobile devices
        let cameraSource = { facingMode: 'environment' }
        try {
          const devices = await Html5Qrcode.getCameras()
          if (devices && devices.length > 0) {
            const rearCamera = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') || 
              d.label.toLowerCase().includes('environment')
            )
            cameraSource = rearCamera ? { deviceId: { exact: rearCamera.id } } : { deviceId: { exact: devices[0].id } }
          }
        } catch (camListErr) {
          // Fallback to standard environment facingMode
          cameraSource = { facingMode: 'environment' }
        }

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const boxSize = Math.max(240, Math.floor(minEdge * 0.9))
            return { width: boxSize, height: boxSize }
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        }

        await scannerRef.current.start(
          cameraSource,
          config,
          (decodedText) => {
            handleCodeScanned(decodedText)
          },
          () => {
            // Ignore scan parse frame drops
          }
        )

        if (isMounted) setIsScanning(true)
      } catch (err) {
        console.warn('Camera start error:', err)
        if (isMounted) {
          setCameraError('Unable to access camera. Please allow camera permissions or use Manual Code / File Upload.')
          setActiveMode('manual')
        }
      }
    }

    startScanner()

    return () => {
      isMounted = false
      stopCameraScanner()
    }
  }, [isOpen, activeMode])

  // Focus manual input when in manual mode
  useEffect(() => {
    if (isOpen && activeMode === 'manual') {
      setTimeout(() => manualInputRef.current?.focus(), 150)
    }
  }, [isOpen, activeMode])

  const stopCameraScanner = async () => {
    if (scannerRef.current && isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true
      try {
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore stop error if already stopped
      } finally {
        scannerRef.current = null
        setIsScanning(false)
        isStoppingRef.current = false
      }
    }
  }

  // Handle scanned string from QR or manual input
  const handleCodeScanned = async (rawInput) => {
    if (!rawInput || isLookingUp || isProcessingRef.current) return
    isProcessingRef.current = true

    try {
      if (scannerRef.current && scannerRef.current.getState() === 2) {
        scannerRef.current.pause()
      }
    } catch (e) {}

    let parsedCode = String(rawInput).trim()

    // Check if input is a structured JSON payload
    try {
      if (parsedCode.startsWith('{') && parsedCode.endsWith('}')) {
        const json = JSON.parse(parsedCode)
        if (json.code || json.token) {
          parsedCode = json.code || json.token
        }
      }
    } catch (e) {
      // Use raw input string
    }

    // Clean up code prefix if pasted with URL
    if (parsedCode.includes('/verify/')) {
      parsedCode = parsedCode.split('/verify/')[1]?.split('?')[0] || parsedCode
    }

    verifyReservationCode(parsedCode)
  }

  // Verify reservation code against API
  const verifyReservationCode = async (code) => {
    setIsLookingUp(true)
    try {
      const res = await api.reservations.verifyReservation(code)
      if (res.status === 'valid') {
        playBeep('success')
        setScannedResult({
          type: 'valid',
          data: res.reservation,
          message: res.message
        })
      } else if (res.status === 'pending_unconfirmed' || (res.reservation && res.reservation.status === 'Pending')) {
        playBeep('warning')
        setScannedResult({
          type: 'pending_unconfirmed',
          data: res.reservation,
          message: res.message || '⚠️ CANNOT SCAN: Reservation is still PENDING APPROVAL. Only confirmed reservations can be scanned.'
        })
      } else if (res.status === 'already_checked_in' || res.is_duplicate) {
        playBeep('warning')
        setScannedResult({
          type: 'already_checked_in',
          data: res.reservation,
          checked_in_at: res.checked_in_at,
          checked_in_by: res.checked_in_by,
          message: res.message
        })
      } else if (res.status === 'cancelled') {
        playBeep('error')
        setScannedResult({
          type: 'cancelled',
          data: res.reservation,
          message: res.message
        })
      } else {
        playBeep('error')
        setScannedResult({
          type: 'not_found',
          code: code,
          message: res.message || 'Invalid reservation code.'
        })
      }
    } catch (err) {
      playBeep('error')
      setScannedResult({
        type: 'not_found',
        code: code,
        message: err.message || `No active reservation found for code "${code}".`
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  // Confirm pending reservation from within the scanner modal
  const handleConfirmPendingReservation = async () => {
    if (!scannedResult?.data) return
    const res = scannedResult.data
    const id = res.reservation_id || res.id

    setIsConfirming(true)
    try {
      const resp = await api.reservations.confirmReservation(id)
      if (resp && resp.status === 'success') {
        playBeep('success')
        showToast(resp.message || 'Reservation confirmed! Scannable QR pass sent.', 'success')
        setScannedResult({
          type: 'valid',
          data: { ...res, status: 'Confirmed' },
          message: `Reservation #${res.reservation_code || id} Confirmed! Ready for seating.`
        })
      } else {
        showToast(resp?.message || 'Failed to confirm reservation', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error confirming reservation', 'error')
    } finally {
      setIsConfirming(false)
    }
  }

  // Scan QR from an uploaded image file
  const handleFileUploadScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      let tempScanner = scannerRef.current
      if (!tempScanner) {
        tempScanner = new Html5Qrcode('jos-qr-reader-target')
      }
      const decodedText = await tempScanner.scanFile(file, true)
      if (decodedText) {
        handleCodeScanned(decodedText)
      }
    } catch (err) {
      playBeep('error')
      showToast('Could not detect a valid QR code in the image. Please try another file.', 'warning')
    } finally {
      e.target.value = ''
    }
  }

  // Confirm guest check-in / mark as seated
  const handleConfirmCheckIn = async () => {
    if (!scannedResult?.data) return
    const res = scannedResult.data
    const code = res.reservation_code || res.id || res.reservation_id

    setIsCheckingIn(true)
    try {
      const response = await api.reservations.checkInReservation({
        code: code,
        staff_name: staffName
      })

      if (response.status === 'success') {
        playBeep('success')
        showToast(response.message, 'success')
        setScannedResult({
          type: 'seated_success',
          data: response.reservation,
          message: response.message
        })
        if (onCheckInSuccess) {
          onCheckInSuccess(response.reservation)
        }
      } else if (response.status === 'already_checked_in') {
        playBeep('warning')
        showToast(response.message, 'success')
        setScannedResult({
          type: 'seated_success',
          data: response.reservation,
          message: response.message
        })
      } else {
        showToast(response.message || 'Check-in failed.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error executing check-in', 'error')
    } finally {
      setIsCheckingIn(false)
    }
  }

  // Reset check-in status (allows re-scanning / override)
  const handleResetCheckIn = async () => {
    if (!scannedResult?.data) return
    const res = scannedResult.data
    const targetId = res.reservation_id || res.id || res.reservation_code
    setIsResetting(true)
    try {
      const response = await api.reservations.resetCheckIn(targetId)
      if (response.status === 'success') {
        playBeep('success')
        showToast(response.message || 'Check-in reset! Ready to re-scan.', 'success')
        // Re-verify so the card immediately changes to valid!
        await verifyReservationCode(res.reservation_code || targetId)
      } else {
        showToast(response.message || 'Failed to reset check-in status.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error resetting check-in', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualCode.trim()) {
      handleCodeScanned(manualCode.trim())
    }
  }

  const resetScannerState = () => {
    setScannedResult(null)
    setManualCode('')
    isProcessingRef.current = false
    try {
      if (scannerRef.current && scannerRef.current.getState() === 3) {
        scannerRef.current.resume()
      }
    } catch (e) {}
    if (activeMode === 'manual') {
      setTimeout(() => manualInputRef.current?.focus(), 100)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl border transition-all ${isDarkMode ? 'bg-[#1C2541] text-white border-slate-700' : 'bg-white text-slate-900 border-slate-300'
        }`}>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8A1224] text-white flex items-center justify-center font-bold shadow-xs">
              <span className="material-icons text-lg">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Guest QR Check-In &amp; Verification
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Scan ticket QR code or enter reservation ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </div>

        {/* Mode Switcher: Live Camera vs Manual Barcode Input */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 gap-1 border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera')
              resetScannerState()
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${activeMode === 'camera'
              ? 'bg-[#C8102E] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="material-icons text-sm">photo_camera</span>
            <span>Live Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('manual')
              resetScannerState()
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${activeMode === 'manual'
              ? 'bg-[#C8102E] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="material-icons text-sm">keyboard</span>
            <span>Manual / Barcode Gun</span>
          </button>
        </div>

        {/* Camera View Mode */}
        {activeMode === 'camera' && !scannedResult && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square sm:aspect-video flex items-center justify-center border border-slate-300 dark:border-slate-700">
              <div id="jos-qr-reader-target" className="w-full h-full"></div>

              {/* Target Aiming Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-60 h-60 sm:w-64 sm:h-64 border-2 border-white/60 rounded-2xl relative overflow-hidden shadow-2xl">
                  {/* Four Corner Reticles */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#C8102E] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#C8102E] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#C8102E] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#C8102E] rounded-br-lg"></div>

                  {/* Active Scanning Laser Line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#C8102E] to-transparent shadow-[0_0_8px_#C8102E] animate-pulse"></div>
                </div>
              </div>

              {isLookingUp && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white space-y-2 z-10">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold">Verifying reservation...</span>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
                <span className="material-icons text-base">warning</span>
                <span>{cameraError}</span>
              </div>
            )}

            {/* Quick Option: Upload QR Image / Screenshot */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400 text-[11px]">Can't scan with camera?</span>
              <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700 transition">
                <span className="material-icons text-sm text-[#C8102E]">file_upload</span>
                <span>Upload QR Image / File</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUploadScan}
                />
              </label>
            </div>
          </div>
        )}

        {/* Manual Barcode / Code Search Mode */}
        {activeMode === 'manual' && !scannedResult && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scan with Handheld Barcode Scanner or Enter Code
              </label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-lg">barcode_reader</span>
                <input
                  ref={manualInputRef}
                  type="text"
                  placeholder="e.g. RES-10492 or paste QR code data..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-10 pr-20 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#C8102E]"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isLookingUp}
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#C8102E] hover:bg-[#9B0B21] disabled:opacity-50 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  {isLookingUp ? 'Searching...' : 'Verify'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              💡 Tip: Handheld 2D laser guns plugged in via USB/Bluetooth will auto-populate and press enter automatically.
            </p>
          </form>
        )}

        {/* VERIFICATION RESULTS PANEL */}
        {scannedResult && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">

            {/* CASE 0: PENDING APPROVAL (CANNOT SCAN / SEAT YET) */}
            {scannedResult.type === 'pending_unconfirmed' && (
              <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-black text-sm">
                    <span className="material-icons text-xl">lock_clock</span>
                    <span>CANNOT SCAN: RESERVATION PENDING APPROVAL</span>
                  </div>
                  <span className="font-mono font-black text-xs text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-800">
                    {scannedResult.data?.reservation_code || scannedResult.data?.id}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-900/60 text-xs space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    This reservation has NOT been confirmed by Staff or Admin yet.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Pending reservations cannot be scanned or seated. Staff or Admin must review and confirm the booking first before this party can check in.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded text-[11px] grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 border border-amber-200/60 dark:border-amber-900/40">
                    <div><strong>Guest:</strong> {scannedResult.data?.contact_name}</div>
                    <div><strong>Phone:</strong> {scannedResult.data?.contact_phone || 'N/A'}</div>
                    <div><strong>Schedule:</strong> {scannedResult.data?.event_date ? String(scannedResult.data.event_date).split('T')[0] : ''} @ {scannedResult.data?.event_time}</div>
                    <div><strong>Party Size:</strong> {scannedResult.data?.guest_count || scannedResult.data?.guests || 2} Pax</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={handleConfirmPendingReservation}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span className="material-icons text-base">check_circle</span>
                    <span>{isConfirming ? 'Confirming...' : 'Approve & Confirm Reservation Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetScannerState}
                    className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* CASE 1: VALID & READY FOR SEATING */}
            {scannedResult.type === 'valid' && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                    <span className="material-icons text-xl">check_circle</span>
                    <span>Valid Reservation Confirmed</span>
                  </div>
                  <span className="font-mono font-black text-xs text-[#C8102E] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                    {scannedResult.data?.reservation_code || scannedResult.data?.id}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900/90 rounded-lg p-3 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Guest Name</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {scannedResult.data?.contact_name}
                    </p>
                    {scannedResult.data?.contact_phone && (
                      <span className="text-[10px] text-slate-400 font-mono">{scannedResult.data?.contact_phone}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Party Size</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {scannedResult.data?.guest_count || scannedResult.data?.guests || 2} Pax
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Date &amp; Time</span>
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      {scannedResult.data?.event_date ? String(scannedResult.data?.event_date).split('T')[0] : ''}
                    </p>
                    <span className="font-bold text-[#C8102E] font-mono text-[11px]">{scannedResult.data?.event_time}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Venue / Category</span>
                    <p className="font-bold text-purple-600 dark:text-purple-400 truncate">
                      {scannedResult.data?.hall_name || scannedResult.data?.event_type || 'Dining Table'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmCheckIn}
                    disabled={isCheckingIn}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span className="material-icons text-base">chair</span>
                    <span>{isCheckingIn ? 'Checking In...' : 'Verify & Seat Party Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetScannerState}
                    className="py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Scan Next
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: DUPLICATE CHECK-IN PREVENTED */}
            {scannedResult.type === 'already_checked_in' && (
              <div className="p-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm">
                    <span className="material-icons text-xl">warning</span>
                    <span>DUPLICATE CHECK-IN DETECTED</span>
                  </div>
                  <span className="font-mono font-black text-xs text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                    {scannedResult.data?.reservation_code || scannedResult.data?.id}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-900/60 text-xs space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    This reservation has already been used for check-in!
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-gray-50 dark:bg-slate-800/60 p-2 rounded">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Guest:</strong> {scannedResult.data?.contact_name}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Ref Code:</strong> {scannedResult.data?.reservation_code || scannedResult.data?.id}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Checked In On:</strong> {scannedResult.data?.checked_in_at || scannedResult.checked_in_at || 'Earlier Today'}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Verified By:</strong> {scannedResult.data?.checked_in_by || scannedResult.checked_in_by || 'Staff'}
                    </div>
                  </div>

                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <span className="material-icons text-xs">info</span>
                    <span>If this guest booked a NEW reservation, please scan their latest QR ticket pass.</span>
                  </p>
                </div>

                <div className="p-2 bg-amber-100/70 dark:bg-amber-950/40 rounded text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                  <span className="material-icons text-xs">shield</span>
                  <span>Duplicate seating was blocked for security &amp; capacity control.</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleResetCheckIn}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Reset check-in status to allow re-entry or testing"
                  >
                    <span className="material-icons text-sm">
                      {isResetting ? 'hourglass_top' : 'restart_alt'}
                    </span>
                    <span>{isResetting ? 'Resetting...' : 'Allow Re-Entry / Reset Check-In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetScannerState}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span className="material-icons text-sm">qr_code_scanner</span>
                    <span>Scan Next QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASE 3: SUCCESSFULLY CHECKED IN */}
            {scannedResult.type === 'seated_success' && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 space-y-3 text-center">
                <span className="material-icons text-4xl text-emerald-500 animate-bounce">check_circle</span>
                <div>
                  <h4 className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    Check-In Complete!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Party for <strong>{scannedResult.data?.contact_name}</strong> is verified and marked as Seated.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetScannerState}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                >
                  Scan Another Reservation
                </button>
              </div>
            )}

            {/* CASE 4: NOT FOUND / CANCELLED */}
            {(scannedResult.type === 'not_found' || scannedResult.type === 'cancelled') && (
              <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                  <span className="material-icons text-lg">error_outline</span>
                  <span>{scannedResult.type === 'cancelled' ? 'Reservation Cancelled' : 'Invalid Reservation QR'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {scannedResult.message}
                </p>
                <button
                  type="button"
                  onClick={resetScannerState}
                  className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}

export default QRScannerModal
