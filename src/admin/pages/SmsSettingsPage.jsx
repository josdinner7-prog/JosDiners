import React, { useState, useEffect } from 'react'
import { useToast } from '../../components/ToastNotification'
import api from '../../services/api'

export default function SmsSettingsPage() {
  const { showToast } = useToast()

  const [settings, setSettings] = useState({
    gateway_provider: 'httpsms',
    httpsms_api_key: '',
    httpsms_from_number: '+639067236264',
    httpsms_webhook_secret: '',
    webhook_url: 'https://api.josdiner.dpdns.org/api/webhooks/httpsms',
    notify_on_inbound: true,
    stats: {}
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Test SMS State & Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [testNumber, setTestNumber] = useState('+639920324749')
  const [testMessage, setTestMessage] = useState("[Jo's Diner] Test SMS from Admin Settings – HttpSMS webhook callback is active!")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // Webhook Logs State
  const [logs, setLogs] = useState([])
  const [logFilter, setLogFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [selectedPayload, setSelectedPayload] = useState(null)
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  // Clear confirmation modal state
  const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false)

  useEffect(() => {
    loadSettings()
    loadWebhookLogs()
    const interval = setInterval(loadWebhookLogs, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const res = await api.sms.getSettings()
      if (res?.status === 'success' && res.data) {
        setSettings({
          gateway_provider: res.data.gateway_provider || 'httpsms',
          httpsms_api_key: res.data.httpsms_api_key || '',
          httpsms_from_number: res.data.httpsms_from_number || '+639067236264',
          httpsms_webhook_secret: res.data.httpsms_webhook_secret || '',
          webhook_url: res.data.webhook_url || 'https://api.josdiner.dpdns.org/api/webhooks/httpsms',
          notify_on_inbound: res.data.notify_on_inbound !== false,
          stats: res.data.stats || {}
        })
      }
    } catch (err) {
      console.error('Failed to load SMS settings:', err)
      showToast('Could not load SMS settings from database.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebhookLogs = async () => {
    setIsLogsLoading(true)
    try {
      const res = await api.sms.getWebhookLogs({ limit: 60 })
      if (res?.status === 'success') {
        setLogs(res.data || [])
      }
    } catch (err) {
      console.error('Failed to load webhook logs:', err)
    } finally {
      setIsLogsLoading(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await api.sms.updateSettings({
        httpsms_api_key: settings.httpsms_api_key,
        httpsms_from_number: settings.httpsms_from_number,
        httpsms_webhook_secret: settings.httpsms_webhook_secret,
        webhook_url: settings.webhook_url,
        notify_on_inbound: settings.notify_on_inbound
      })
      if (res?.status === 'success') {
        showToast(res.message || 'SMS Gateway & Webhook configuration saved successfully!', 'success')
        loadSettings()
      } else {
        showToast(res?.message || 'Failed to save settings.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error updating SMS settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyWebhookUrl = () => {
    const url = settings.webhook_url || 'https://api.josdiner.dpdns.org/api/webhooks/httpsms'
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    showToast('Webhook Callback URL copied to clipboard!', 'success')
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  const handleSendTestSMS = async (e) => {
    e.preventDefault()
    if (!testNumber) {
      showToast('Please provide a recipient mobile phone number.', 'warning')
      return
    }
    setIsSendingTest(true)
    setTestResult(null)
    try {
      const res = await api.sms.sendTest(testNumber, testMessage)
      if (res?.status === 'success') {
        setTestResult({
          success: true,
          message: res.message || 'Test SMS dispatched successfully!',
          messageId: res.message_id
        })
        showToast('Test SMS sent to mobile phone!', 'success')
        setTimeout(loadWebhookLogs, 2500)
      } else {
        setTestResult({
          success: false,
          message: res?.message || 'Failed to send test SMS.'
        })
        showToast(res?.message || 'Send failed.', 'error')
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Network error sending test SMS.'
      })
      showToast(err.message || 'Error sending test SMS.', 'error')
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleClearLogs = async () => {
    try {
      const res = await api.sms.clearWebhookLogs()
      if (res?.status === 'success') {
        showToast('All webhook event logs cleared.', 'info')
        setLogs([])
        setIsClearLogsModalOpen(false)
        loadSettings()
      }
    } catch (err) {
      showToast(err.message || 'Error clearing logs.', 'error')
    }
  }

  const handleCopyPayload = () => {
    if (!selectedPayload) return
    navigator.clipboard.writeText(JSON.stringify(selectedPayload, null, 2))
    setCopiedPayload(true)
    showToast('JSON payload copied to clipboard!', 'success')
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesFilter = logFilter === 'all' || log.event_type === logFilter
    const s = logSearch.toLowerCase().trim()
    const matchesSearch = !s ||
      log.phone_number?.toLowerCase().includes(s) ||
      log.content?.toLowerCase().includes(s) ||
      log.message_id?.toLowerCase().includes(s)
    return matchesFilter && matchesSearch
  })

  const getEventBadge = (type) => {
    switch (type) {
      case 'message.phone.delivered':
        return { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-300', icon: 'check_circle' }
      case 'message.phone.sent':
        return { label: 'Sent via Phone', bg: 'bg-blue-50 text-blue-700 border border-blue-300', icon: 'send' }
      case 'message.phone.received':
        return { label: 'Inbound Reply', bg: 'bg-purple-50 text-purple-700 border border-purple-300', icon: 'mark_email_unread' }
      case 'message.send.failed':
        return { label: 'Failed', bg: 'bg-red-50 text-[#C8102E] border border-red-300', icon: 'error' }
      case 'message.send.expired':
        return { label: 'Expired', bg: 'bg-amber-50 text-amber-800 border border-amber-300', icon: 'schedule' }
      default:
        return { label: type || 'Unknown', bg: 'bg-gray-100 text-gray-700 border border-gray-300', icon: 'notifications' }
    }
  }

  const totalDelivered = settings.stats?.delivered_count || logs.filter(l => l.event_type === 'message.phone.delivered').length
  const totalSent = settings.stats?.sent_count || logs.filter(l => l.event_type === 'message.phone.sent').length
  const totalInbound = settings.stats?.inbound_count || logs.filter(l => l.event_type === 'message.phone.received').length
  const totalEvents = settings.stats?.total_webhook_events || logs.length

  return (
    <div className="space-y-5 font-sans">
      
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            SMS Gateway &amp; Webhook Settings
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Connect Android SIM handsets via HttpSMS gateway, configure webhook callbacks, send test SMS, and audit real-time customer deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-icons text-base">send_to_mobile</span>
            <span>Send Test SMS</span>
          </button>

          <a
            href="https://httpsms.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 no-underline cursor-pointer"
          >
            <span className="material-icons text-base text-indigo-600">open_in_new</span>
            <span>HttpSMS Dashboard</span>
          </a>

          <button
            type="button"
            onClick={loadWebhookLogs}
            className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 transition cursor-pointer shadow-2xs"
            title="Refresh logs from database"
          >
            <span className={`material-icons text-base block ${isLogsLoading ? 'animate-spin text-[#C8102E]' : ''}`}>refresh</span>
          </button>
        </div>
      </header>

      {/* 2. METRICS & SUMMARY CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Webhooks */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
            <span className="material-icons text-2xl">webhook</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Webhook Logs</span>
            <span className="text-xl font-black text-[#071A3D] tracking-tight">{totalEvents} Events</span>
          </div>
        </div>

        {/* Card 2: Delivered SMS */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <span className="material-icons text-2xl">done_all</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Handset Delivered</span>
            <span className="text-xl font-black text-emerald-700 tracking-tight">{totalDelivered} Confirmed</span>
          </div>
        </div>

        {/* Card 3: Dispatched via Phone */}
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <span className="material-icons text-2xl">phone_android</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Dispatched via Phone</span>
            <span className="text-xl font-black text-blue-700 tracking-tight">{totalSent} Sent</span>
          </div>
        </div>

        {/* Card 4: Dark Navy Accent Card */}
        <div className="bg-[#071A3D] p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3 text-white">
          <div className="w-12 h-12 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center border border-white/20 shrink-0">
            <span className="material-icons text-2xl">mark_chat_unread</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider block">Inbound Customer Replies</span>
            <span className="text-xl font-black text-amber-400 tracking-tight font-mono">{totalInbound} Replies</span>
          </div>
        </div>
      </div>

      {/* 3. SPLIT SECTIONS: Webhook Setup Box & Gateway Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COL: Webhook Callback URL & Modal Setup Guide */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            {/* Box Header */}
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">link</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#071A3D] tracking-tight">HttpSMS Webhook Callback URL</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Use this URL in your HttpSMS "Add a new webhook" modal</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* Copy URL Input Group */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Callback URL (POST Receiver Endpoint)
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-300 shadow-2xs">
                  <span className="material-icons text-emerald-600 text-sm pl-1">check_circle</span>
                  <input
                    type="text"
                    readOnly
                    value={settings.webhook_url || 'https://api.josdiner.dpdns.org/api/webhooks/httpsms'}
                    className="flex-1 bg-transparent font-mono text-xs font-bold text-gray-800 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-2xs"
                  >
                    <span className="material-icons text-xs">{copiedUrl ? 'done' : 'content_copy'}</span>
                    <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Setup Guide Box */}
              <div className="p-4 rounded-xl bg-white border border-gray-300 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="material-icons text-amber-600 text-sm">tune</span>
                  <span className="font-black text-[11px] text-[#071A3D] uppercase tracking-wider">
                    HttpSMS "Add a new webhook" Modal Fields:
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#C8102E] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <span className="font-bold text-[#071A3D]">Callback URL: </span>
                      <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">https://api.josdiner.dpdns.org/api/webhooks/httpsms</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#C8102E] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-bold text-[#071A3D]">Signing Key: </span>
                      <span className="text-gray-600">Enter a secret key or keep blank (used for HMAC-SHA256 signature verification).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#C8102E] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-bold text-[#071A3D]">Events to select (all 5): </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[10px] font-bold">message.phone.received</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold">message.phone.sent</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">message.phone.delivered</span>
                        <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[#C8102E] font-mono text-[10px] font-bold">message.send.failed</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold">message.send.expired</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-[#C8102E] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <div>
                      <span className="font-bold text-[#071A3D]">Phone Numbers: </span>
                      <span className="text-gray-600">Check both SIM phone numbers (e.g. <code className="font-bold text-gray-800">+639067236264</code>, <code className="font-bold text-gray-800">+639920324749</code>).</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: Gateway Credentials Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            {/* Box Header */}
            <div className="p-4 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">vpn_key</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#071A3D] tracking-tight">HttpSMS Gateway Credentials</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Configure authentication keys and default sender SIM number</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* API Key */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  HttpSMS API Key (x-api-key) *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    required
                    placeholder="Enter your HttpSMS API Key..."
                    value={settings.httpsms_api_key}
                    onChange={e => setSettings({ ...settings, httpsms_api_key: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] text-gray-800 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-icons text-sm">{showApiKey ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Obtained from <a href="https://httpsms.com/settings" target="_blank" rel="noreferrer" className="text-[#C8102E] underline">httpsms.com/settings</a> (API Keys tab).</p>
              </div>

              {/* From Number */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Default Sender Mobile Number (E.164 format) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+639067236264"
                  value={settings.httpsms_from_number}
                  onChange={e => setSettings({ ...settings, httpsms_from_number: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] text-gray-800 font-mono text-xs font-bold"
                />
                <p className="text-[10px] text-gray-500 mt-1">SIM phone number inserted into your Android handset running HttpSMS app.</p>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Webhook Signing Key / Secret (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder="Leave blank or enter matching signing key..."
                    value={settings.httpsms_webhook_secret}
                    onChange={e => setSettings({ ...settings, httpsms_webhook_secret: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] text-gray-800 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-icons text-sm">{showSecret ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">If specified, incoming webhooks must include a valid HS256 JWT signature header.</p>
              </div>

              {/* Inbound Alert Toggle */}
              <div className="p-3 bg-white rounded-xl border border-gray-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#071A3D] block text-xs">Admin Notification on Inbound SMS</span>
                  <span className="text-[10px] text-gray-500">Create system alerts when customers reply to our SMS.</span>
                </div>
                <input
                  type="checkbox"
                  id="notifyToggle"
                  checked={settings.notify_on_inbound}
                  onChange={e => setSettings({ ...settings, notify_on_inbound: e.target.checked })}
                  className="w-4 h-4 accent-[#C8102E] cursor-pointer"
                />
              </div>

              {/* Form Action */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-icons text-base">save</span>
                  <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 4. WEBHOOK LOGS ACTIVITY TABLE */}
      <div className="space-y-3">
        {/* Table Filter & Search Bar */}
        <div className="bg-white p-3.5 rounded-lg border border-gray-400 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="material-icons text-sm text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input
              type="text"
              placeholder="Search phone, message, or ID..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:border-[#C8102E] text-xs font-medium"
            />
            {logSearch && (
              <button onClick={() => setLogSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <span className="material-icons text-xs">close</span>
              </button>
            )}
          </div>

          {/* Event Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'message.phone.delivered', label: 'Delivered' },
              { id: 'message.phone.sent', label: 'Sent' },
              { id: 'message.phone.received', label: 'Inbound' },
              { id: 'message.send.failed', label: 'Failed' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLogFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  logFilter === f.id
                    ? 'bg-[#C8102E] text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}

            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearLogsModalOpen(true)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition cursor-pointer ml-auto md:ml-2"
                title="Clear all webhook history"
              >
                <span className="material-icons text-base">delete_sweep</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Contact Phone</th>
                  <th className="p-3.5">Message / Content</th>
                  <th className="p-3.5">Delivery Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 font-medium">
                {isLogsLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400 font-bold">
                      <div className="w-8 h-8 rounded-full border-2 border-[#C8102E] border-t-transparent animate-spin mx-auto mb-2" />
                      <span>Loading webhook audit history from database...</span>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                        <span className="material-icons text-2xl">sms_failed</span>
                      </div>
                      <p className="text-sm font-black text-[#071A3D]">No Webhook Activity Logged</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        {logSearch || logFilter !== 'all'
                          ? 'No webhook callbacks match your current filter or search keyword.'
                          : 'Waiting for HttpSMS callback events. Send a test SMS or receive an inbound customer message to view logs.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const badge = getEventBadge(log.event_type)
                    return (
                      <tr key={log.log_id} className="hover:bg-gray-50/70 transition">
                        {/* Timestamp */}
                        <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        {/* Event Type Badge */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase inline-flex items-center gap-1 ${badge.bg}`}>
                            <span className="material-icons text-xs">{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Phone Number */}
                        <td className="p-3.5 font-mono font-bold text-[#071A3D] whitespace-nowrap">
                          {log.phone_number || 'N/A'}
                        </td>

                        {/* Message Content */}
                        <td className="p-3.5 text-gray-700 max-w-xs truncate">
                          <span>{log.content || <em className="text-gray-400 font-normal">No message body recorded</em>}</span>
                          {log.failure_reason && (
                            <span className="block text-[10px] text-[#C8102E] font-bold">Failure: {log.failure_reason}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] font-bold text-gray-600 uppercase bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {log.status || 'received'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                setSelectedPayload(log.raw_payload ? JSON.parse(log.raw_payload) : log)
                              } catch (e) {
                                setSelectedPayload(log.raw_payload || log)
                              }
                            }}
                            className="p-1.5 px-2.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 font-bold text-[11px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            title="View Raw Webhook Payload"
                          >
                            <span className="material-icons text-xs text-indigo-600">code</span>
                            <span>View JSON</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL 1: SEND LIVE TEST SMS MODAL                                      */}
      {/* ========================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">send_to_mobile</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Send Live Test SMS</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Verify your Android SIM transmitter and HttpSMS webhook callback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTestModalOpen(false)
                  setTestResult(null)
                }}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleSendTestSMS} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* Recipient Number */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                  Recipient Mobile Number (E.164 Format) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+639920324749"
                  value={testNumber}
                  onChange={e => setTestNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] font-mono text-xs font-bold text-gray-800 shadow-2xs"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Example: +639920324749 (Philippines) or your mobile test phone.</span>
              </div>

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-bold text-[11px]">Message Content *</label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {testMessage.length}/160 chars ({Math.ceil(testMessage.length / 160) || 1} SMS)
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 focus:outline-none focus:border-[#C8102E] text-xs font-semibold text-gray-800 shadow-2xs resize-none"
                />
              </div>

              {/* Quick Template Presets */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTestMessage("[Jo's Diner] Webhook Verification: Your reservation request has been received.")}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Booking Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestMessage("[Jo's Diner] Table Ready: Your dining table #4 is prepared. Enjoy your meal!")}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Table Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestMessage("[Jo's Diner] HttpSMS live test from Admin Settings portal.")}
                    className="px-2 py-1 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Short Test
                  </button>
                </div>
              </div>

              {/* Result Notice */}
              {testResult && (
                <div className={`p-3 rounded-xl border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border-red-300 text-[#C8102E]'
                }`}>
                  <div className="flex items-center gap-1.5 font-black text-xs mb-0.5">
                    <span className="material-icons text-sm">{testResult.success ? 'check_circle' : 'error'}</span>
                    <span>{testResult.success ? 'Test Dispatched' : 'Dispatch Failed'}</span>
                  </div>
                  <p className="text-[11px] font-medium">{testResult.message}</p>
                  {testResult.messageId && (
                    <p className="text-[10px] font-mono mt-1 text-gray-600">HttpSMS Message ID: {testResult.messageId}</p>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestModalOpen(false)
                    setTestResult(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-icons text-sm">{isSendingTest ? 'hourglass_top' : 'send'}</span>
                  <span>{isSendingTest ? 'Transmitting...' : 'Dispatch Live SMS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL 2: RAW JSON WEBHOOK PAYLOAD VIEWER                               */}
      {/* ========================================================================= */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col my-auto text-[#071A3D]">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">code</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Raw Webhook Event Payload</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Inbound JSON transmission received from api.httpsms.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Body */}
            <div className="p-5 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">JSON Inspector:</span>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-[10px] font-bold text-gray-700 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <span className="material-icons text-xs">{copiedPayload ? 'done' : 'content_copy'}</span>
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-gray-300 bg-[#071A3D] text-emerald-400 p-3.5 max-h-96 overflow-auto font-mono text-[11px] leading-relaxed shadow-inner">
                <pre>{JSON.stringify(selectedPayload, null, 2)}</pre>
              </div>
            </div>

            {/* Modal Footer */}
            <footer className="p-3.5 px-5 bg-white border-t border-gray-300 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
              >
                Close Inspector
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL 3: CLEAR LOGS CONFIRMATION MODAL                                 */}
      {/* ========================================================================= */}
      {isClearLogsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#C8102E] flex items-center justify-center font-bold border border-red-300 shrink-0">
                  <span className="material-icons text-base">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Clear Webhook Event Logs?</h3>
                  <p className="text-[10px] text-gray-500 font-medium">This will remove all recorded webhook callback records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearLogsModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            <div className="p-5 space-y-2 text-xs font-semibold text-gray-700 bg-gray-50/40">
              <p>Are you sure you want to permanently clear the recorded SMS webhook activity logs from the database?</p>
              <p className="text-[11px] text-gray-500 font-normal">This action cannot be undone, but future incoming webhooks will continue to be recorded normally.</p>
            </div>

            <footer className="p-3.5 px-5 bg-white border-t border-gray-300 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearLogsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
              >
                <span className="material-icons text-sm">delete_forever</span>
                <span>Yes, Clear Logs</span>
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  )
}
