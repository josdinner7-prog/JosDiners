import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import logo from '../../assets/logo.png'

const CUSTOMER_APK_URL = 'https://github.com/josdinner7-prog/JosDiners/releases/download/app-latest/JosDiners-Customer.apk'
const TEAM_APK_URL = 'https://github.com/josdinner7-prog/JosDiners/releases/download/app-latest/JosDiners-Team.apk'

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl border border-slate-100 dark:border-slate-800 p-2.5 mb-4">
          <img src={logo} alt="Jo's Diner Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#071A3D] dark:text-white tracking-tight">
          Get the <span className="text-[#C8102E]">Jo's Diner</span> Mobile App
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Order food faster, reserve function halls, track deliveries in real time, and enjoy exclusive app-only treats right from your Android device.
        </p>
      </div>

      {/* Main Download Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Customer App (Primary) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#C8102E]/30 shadow-xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#C8102E] text-white text-[11px] font-black tracking-wider uppercase">
            Customer App
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-icons text-3xl text-[#C8102E]">restaurant</span>
              <div>
                <h2 className="text-xl font-black text-[#071A3D] dark:text-white">Jo's Diner</h2>
                <span className="text-xs text-slate-400 font-mono">v1.0 • Android APK</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Designed for diners and event planners. Browse our delicious diner menu, place pickup or delivery orders, schedule catering trays, and reserve venue halls seamlessly.
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                <span>Fast & smooth mobile ordering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                <span>Real-time courier GPS & order status updates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                <span>Function hall reservations with instant QR pass</span>
              </div>
            </div>
          </div>

          <div>
            {/* Direct Download Button */}
            <a
              href={CUSTOMER_APK_URL}
              download="JosDiners-Customer.apk"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#C8102E] to-red-700 text-white font-black text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition active:scale-98"
            >
              <span className="material-icons text-xl">android</span>
              <span>Download Customer APK</span>
            </a>

            {/* QR Code for Desktop Users */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <QRCodeSVG value={CUSTOMER_APK_URL} size={74} level="M" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                <strong className="block text-[#071A3D] dark:text-white font-bold mb-0.5">Browsing on Desktop?</strong>
                Scan this QR code with your phone camera to download directly onto your smartphone.
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Team App (Staff & Riders) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-icons text-3xl text-[#071A3D] dark:text-blue-400">two_wheeler</span>
              <div>
                <h2 className="text-xl font-black text-[#071A3D] dark:text-white">Jo's Diner Team</h2>
                <span className="text-xs text-slate-400 font-mono">v1.0 • Internal Portal</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Reserved for Jo's Diner authorized personnel. Includes delivery courier management, kitchen queue display (KDS), counter POS, and admin analytics.
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-500 text-sm">check_circle</span>
                <span>Delivery rider request dispatch & earnings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-500 text-sm">check_circle</span>
                <span>Kitchen queue line terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-500 text-sm">check_circle</span>
                <span>Waitstaff and cashier order entry</span>
              </div>
            </div>
          </div>

          <div>
            <a
              href={TEAM_APK_URL}
              download="JosDiners-Team.apk"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#071A3D] hover:bg-slate-800 text-white font-black text-sm shadow-md transition active:scale-98"
            >
              <span className="material-icons text-xl">badge</span>
              <span>Download Team APK</span>
            </a>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <QRCodeSVG value={TEAM_APK_URL} size={74} level="M" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                <strong className="block text-[#071A3D] dark:text-white font-bold mb-0.5">Staff & Rider Scan</strong>
                Couriers can scan to install the dispatch terminal directly on their delivery motorcycles.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-black text-[#071A3D] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-[#C8102E]">help_outline</span>
          How to Install the APK on Your Android Device
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-[#C8102E] text-white font-black flex items-center justify-center text-xs">
              1
            </div>
            <strong className="block font-bold text-[#071A3D] dark:text-white">Download the File</strong>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Tap the download button above or scan the QR code with your camera.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-[#C8102E] text-white font-black flex items-center justify-center text-xs">
              2
            </div>
            <strong className="block font-bold text-[#071A3D] dark:text-white">Allow Download</strong>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              If your browser asks <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="w-7 h-7 rounded-full bg-[#C8102E] text-white font-black flex items-center justify-center text-xs">
              3
            </div>
            <strong className="block font-bold text-[#071A3D] dark:text-white">Open & Install</strong>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Tap the downloaded file from your notifications bar and press <strong>Install</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
