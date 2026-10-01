import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useToast } from '../../components/ToastNotification'
import ConfirmationModal from '../components/ConfirmationModal'
import PaginationControls from '../../components/PaginationControls'

const EVENT_STAFF_ROLES = [
  'Executive Head Chef',
  'Lead Banquet Chef',
  'Sous Chef',
  'Banquet Captain / Lead Coordinator',
  'Floor Supervisor',
  'Food & Beverage Attendant',
  'Senior Waiter',
  'Service Waitstaff',
  'Buffet Line Attendant',
  'Bartender / Mocktail Specialist',
  'Logistics Driver & Table Setup Attendant'
]

// High-fidelity Skeleton for Executive Metric Tiles
function MetricTilesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0"></div>
          <div className="space-y-1.5 flex-1">
            <div className="h-2.5 w-20 bg-gray-200 rounded-md"></div>
            <div className="h-6 w-28 bg-gray-300 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// High-fidelity Skeleton for Roster Cards
function RosterCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-400 shadow-xs p-4 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-48 bg-gray-200 rounded-md"></div>
          <div className="h-3 w-32 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
    </div>
  )
}

function EventStaffSchedulingPage({ isStaff = false }) {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [rosterList, setRosterList] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [eventsList, setEventsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Views
  const [viewMode, setViewMode] = useState('events') // 'events' | 'personnel' | 'table'
  const [filterDate, setFilterDate] = useState('all') // 'all' | 'today' | 'upcoming'
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [assignmentToDelete, setAssignmentToDelete] = useState(null)

  // Duty Confirmation SMS Modal State
  const [smsModalAssignment, setSmsModalAssignment] = useState(null)
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('')
  const [smsCustomMessage, setSmsCustomMessage] = useState('')
  const [isSendingSms, setIsSendingSms] = useState(false)

  // Bulk SMS Modal State
  const [bulkSmsEvent, setBulkSmsEvent] = useState(null)
  const [isSendingBulkSms, setIsSendingBulkSms] = useState(false)

  // Assignment Form State
  const [formEventId, setFormEventId] = useState('')
  const [formEventTitle, setFormEventTitle] = useState('')
  const [formEventDate, setFormEventDate] = useState(new Date().toISOString().split('T')[0])
  const [formEventTime, setFormEventTime] = useState('11:30 AM - 02:30 PM')
  const [formEventVenue, setFormEventVenue] = useState('Grand Ballroom Hall A')
  const [formUserId, setFormUserId] = useState('')
  const [formStaffName, setFormStaffName] = useState('')
  const [formStaffRole, setFormStaffRole] = useState('staff')
  const [formPhoneNumber, setFormPhoneNumber] = useState('')
  const [formAssignedRole, setFormAssignedRole] = useState('Service Waitstaff')
  const [formCallTime, setFormCallTime] = useState('09:00 AM')
  const [formEndTime, setFormEndTime] = useState('04:00 PM')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState('Confirmed')
  const [formSendSmsImmediately, setFormSendSmsImmediately] = useState(false)

  // Load Roster, Staff Members, and Catering Events
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [rosterRes, staffRes, eventRes] = await Promise.all([
        api.staff.getEventRoster().catch(() => ({ roster: [] })),
        api.staff.getUsers().catch(() => ({ users: [] })),
        api.reservations.getReservations().catch(() => ({ reservations: [] }))
      ])

      const rList = rosterRes?.roster || []
      setRosterList(rList)

      const sList = (staffRes?.users || []).filter(u => u.role !== 'admin')
      setStaffUsers(sList)

      // Filter reservations for catering & banquet events
      const cateringEvts = (eventRes?.reservations || []).filter(r => {
        const type = (r.reservation_type || r.type || '').toLowerCase()
        const occasion = (r.occasion || '').toLowerCase()
        const guests = parseInt(r.guest_count || r.guests || 0, 10)
        return type.includes('catering') || type.includes('hall') || type.includes('event') || guests >= 10 || occasion.includes('wedding') || occasion.includes('birthday')
      })
      setEventsList(cateringEvts)
    } catch (err) {
      console.error('Error fetching event staff data:', err)
      showToast('Could not load staff roster data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]

  // Detect Scheduling Conflicts in current roster
  const conflictMap = useMemo(() => {
    const map = {}
    rosterList.forEach(item => {
      const key = `${item.staff_name}_${item.event_date}`
      if (!map[key]) {
        map[key] = []
      }
      map[key].push(item)
    })
    return map
  }, [rosterList])

  const totalConflictsCount = useMemo(() => {
    let count = 0
    Object.values(conflictMap).forEach(list => {
      if (list.length > 1) {
        count += list.length
      }
    })
    return count
  }, [conflictMap])

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return rosterList.filter(item => {
      // Date Filter
      if (filterDate === 'today' && item.event_date !== todayStr) return false
      if (filterDate === 'upcoming' && item.event_date < todayStr) return false

      // Role Filter
      if (roleFilter !== 'all' && item.assigned_role !== roleFilter) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const staffMatch = (item.staff_name || '').toLowerCase().includes(q)
        const eventMatch = (item.event_title || '').toLowerCase().includes(q)
        const roleMatch = (item.assigned_role || '').toLowerCase().includes(q)
        const venueMatch = (item.event_venue || '').toLowerCase().includes(q)
        if (!staffMatch && !eventMatch && !roleMatch && !venueMatch) return false
      }

      return true
    })
  }, [rosterList, filterDate, roleFilter, searchQuery, todayStr])

  // Groupings
  const groupedByEvent = useMemo(() => {
    const groups = {}
    filteredRoster.forEach(item => {
      const key = `${item.event_title}_${item.event_date}`
      if (!groups[key]) {
        groups[key] = {
          event_title: item.event_title,
          event_date: item.event_date,
          event_time: item.event_time,
          event_venue: item.event_venue,
          reservation_id: item.reservation_id,
          assignments: []
        }
      }
      groups[key].assignments.push(item)
    })
    return Object.values(groups)
  }, [filteredRoster])

  const groupedByStaff = useMemo(() => {
    const groups = {}
    filteredRoster.forEach(item => {
      const key = item.staff_name
      if (!groups[key]) {
        groups[key] = {
          staff_name: item.staff_name,
          staff_role: item.staff_role,
          assignments: []
        }
      }
      groups[key].assignments.push(item)
    })
    return Object.values(groups)
  }, [filteredRoster])

  // Pagination for linear table view
  const totalPages = Math.max(1, Math.ceil(filteredRoster.length / itemsPerPage))
  const paginatedRoster = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRoster.slice(start, start + itemsPerPage)
  }, [filteredRoster, currentPage, itemsPerPage])

  // Handle Opening Assignment Modal
  const handleOpenAssignModal = (prefillEvent = null, assignmentToEdit = null) => {
    if (assignmentToEdit) {
      setEditingAssignment(assignmentToEdit)
      setFormEventId(assignmentToEdit.reservation_id || '')
      setFormEventTitle(assignmentToEdit.event_title || '')
      setFormEventDate(assignmentToEdit.event_date || todayStr)
      setFormEventTime(assignmentToEdit.event_time || '11:30 AM')
      setFormEventVenue(assignmentToEdit.event_venue || 'Main Ballroom')
      setFormUserId(assignmentToEdit.user_id || '')
      setFormStaffName(assignmentToEdit.staff_name || '')
      setFormStaffRole(assignmentToEdit.staff_role || 'staff')
      setFormPhoneNumber(assignmentToEdit.phone_number || '')
      setFormAssignedRole(assignmentToEdit.assigned_role || 'Service Waitstaff')
      setFormCallTime(assignmentToEdit.call_time || '09:00 AM')
      setFormEndTime(assignmentToEdit.end_time || '04:00 PM')
      setFormNotes(assignmentToEdit.notes || '')
      setFormStatus(assignmentToEdit.status || 'Confirmed')
      setFormSendSmsImmediately(false)
    } else {
      setEditingAssignment(null)
      if (prefillEvent) {
        setFormEventId(prefillEvent.id || prefillEvent.reservation_id || '')
        setFormEventTitle(prefillEvent.event_title || prefillEvent.occasion || 'Banquet Catering Event')
        setFormEventDate(prefillEvent.event_date || todayStr)
        setFormEventTime(prefillEvent.event_time || '11:30 AM - 02:30 PM')
        setFormEventVenue(prefillEvent.event_venue || prefillEvent.hall_name || 'Grand Ballroom')
      } else {
        setFormEventId('')
        setFormEventTitle('Banquet Celebration')
        setFormEventDate(todayStr)
        setFormEventTime('11:30 AM - 02:30 PM')
        setFormEventVenue("Jo's Diner Grand Ballroom")
      }
      setFormUserId('')
      setFormStaffName('')
      setFormStaffRole('staff')
      setFormPhoneNumber('')
      setFormAssignedRole('Service Waitstaff')
      setFormCallTime('09:00 AM')
      setFormEndTime('04:00 PM')
      setFormNotes('')
      setFormStatus('Confirmed')
      setFormSendSmsImmediately(false)
    }
    setIsAssignModalOpen(true)
  }

  // Handle Event selection in form
  const handleSelectEvent = (e) => {
    const resId = e.target.value
    setFormEventId(resId)
    const selected = eventsList.find(ev => String(ev.id || ev.reservation_id) === String(resId))
    if (selected) {
      setFormEventTitle(selected.event_title || selected.occasion || 'Banquet Event')
      setFormEventDate(selected.event_date || selected.reservation_date || todayStr)
      setFormEventTime(selected.event_time || selected.reservation_time || '11:30 AM')
      setFormEventVenue(selected.event_venue || selected.hall_name || "Jo's Diner Ballroom")
    }
  }

  // Handle Staff manual name entry with optional registered user link
  const handleStaffNameChange = (e) => {
    const val = e.target.value
    setFormStaffName(val)
    const found = staffUsers.find(
      u => (u.full_name || u.username || '').trim().toLowerCase() === val.trim().toLowerCase()
    )
    if (found) {
      setFormStaffRole(found.role || 'staff')
      setFormUserId(found.user_id || '')
      if (found.phone_number) {
        setFormPhoneNumber(found.phone_number)
      }
    } else {
      setFormUserId('')
    }
  }

  // Save Assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault()
    if (!formEventTitle || !formStaffName.trim() || !formAssignedRole) {
      showToast("Please enter the staff member's name and all required assignment details", 'error')
      return
    }

    try {
      const payload = {
        reservation_id: formEventId ? parseInt(formEventId, 10) : null,
        event_title: formEventTitle,
        event_date: formEventDate,
        event_time: formEventTime,
        event_venue: formEventVenue,
        user_id: formUserId ? parseInt(formUserId, 10) : null,
        staff_name: formStaffName,
        staff_role: formStaffRole,
        phone_number: formPhoneNumber.trim() || null,
        assigned_role: formAssignedRole,
        call_time: formCallTime,
        end_time: formEndTime,
        notes: formNotes,
        status: formStatus
      }

      if (editingAssignment) {
        await api.staff.updateEventRosterAssignment(editingAssignment.roster_id, payload)
        if (formSendSmsImmediately && formPhoneNumber.trim()) {
          try {
            await api.staff.sendDutySMS(editingAssignment.roster_id, { phone_number: formPhoneNumber.trim() })
            showToast(`Updated assignment & dispatched duty confirmation SMS to ${formStaffName}!`, 'success')
          } catch (smsErr) {
            showToast(`Assignment updated, but SMS failed: ${smsErr.message}`, 'warning')
          }
        } else {
          showToast(`Updated assignment for ${formStaffName}!`, 'success')
        }
      } else {
        const res = await api.staff.createEventRosterAssignment(payload)
        const newRosterId = res?.roster_id
        if (formSendSmsImmediately && newRosterId && formPhoneNumber.trim()) {
          try {
            await api.staff.sendDutySMS(newRosterId, { phone_number: formPhoneNumber.trim() })
            showToast(`Assigned ${formStaffName} & sent duty confirmation SMS!`, 'success')
          } catch (smsErr) {
            showToast(`Staff assigned, but SMS dispatch warning: ${smsErr.message}`, 'warning')
          }
        } else if (res?.hasConflict) {
          showToast(`⚠️ Warning: ${res.conflictDetails}`, 'warning')
        } else {
          showToast(`Assigned ${formStaffName} to "${formEventTitle}"!`, 'success')
        }
      }

      setIsAssignModalOpen(false)
      fetchData()
    } catch (err) {
      console.error('Save assignment error:', err)
      showToast('Failed to save staff schedule assignment', 'error')
    }
  }

  // Open SMS Confirmation Modal for a Staff Member
  const handleOpenSmsModal = (assignment) => {
    const userMatch = staffUsers.find(u => (u.full_name || u.username) === assignment.staff_name)
    const phone = assignment.phone_number || userMatch?.phone_number || '+639067236264'
    const formattedDate = assignment.event_date
      ? new Date(assignment.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Scheduled Date'
    const callTimeDisplay = assignment.call_time
      ? (assignment.end_time ? `${assignment.call_time} - ${assignment.end_time}` : assignment.call_time)
      : assignment.event_time || 'TBA'

    const defaultMsg = `[Jo's Diner Duty Confirmation]
Hello ${assignment.staff_name}! You are confirmed ON DUTY for "${assignment.event_title}".
Date: ${formattedDate}
Call Time: ${callTimeDisplay}
Role: ${assignment.assigned_role}
Venue: ${assignment.event_venue || "Jo's Diner Ballroom"}
${assignment.notes ? `Instructions: ${assignment.notes}\n` : ''}Please arrive 15 mins before call time. - Jo's Diner Team`

    setSmsModalAssignment(assignment)
    setSmsPhoneNumber(phone)
    setSmsCustomMessage(defaultMsg)
  }

  // Send Single Duty Confirmation SMS
  const handleConfirmSendSms = async (e) => {
    e.preventDefault()
    if (!smsModalAssignment) return
    if (!smsPhoneNumber.trim()) {
      showToast('Please enter a valid mobile number for the staff member.', 'error')
      return
    }

    setIsSendingSms(true)
    try {
      const res = await api.staff.sendDutySMS(smsModalAssignment.roster_id, {
        phone_number: smsPhoneNumber.trim(),
        custom_message: smsCustomMessage.trim()
      })

      if (res?.status === 'success') {
        showToast(`Duty confirmation SMS sent to ${smsModalAssignment.staff_name} (${smsPhoneNumber})!`, 'success')
        setRosterList(prev => prev.map(item => {
          if (item.roster_id === smsModalAssignment.roster_id) {
            return {
              ...item,
              phone_number: smsPhoneNumber.trim(),
              last_sms_sent_at: res.last_sms_sent_at || new Date().toISOString(),
              sms_status: 'sent'
            }
          }
          return item
        }))
        setSmsModalAssignment(null)
      } else {
        showToast(res?.message || 'Failed to dispatch SMS notification.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error sending SMS notification.', 'error')
    } finally {
      setIsSendingSms(false)
    }
  }

  // Open Bulk SMS Modal for an Event
  const handleBulkSendSms = (grp) => {
    if (!grp || !grp.assignments || grp.assignments.length === 0) {
      showToast('No personnel deployed for this event.', 'warning')
      return
    }
    setBulkSmsEvent(grp)
  }

  // Confirm Bulk SMS
  const handleConfirmBulkSms = async () => {
    if (!bulkSmsEvent) return
    setIsSendingBulkSms(true)
    try {
      const res = await api.staff.sendEventBulkDutySMS({
        reservation_id: bulkSmsEvent.reservation_id,
        event_title: bulkSmsEvent.event_title,
        event_date: bulkSmsEvent.event_date
      })
      if (res?.status === 'success') {
        showToast(res.message || 'Duty confirmation SMS dispatched to all crew!', 'success')
        await fetchData()
        setBulkSmsEvent(null)
      } else {
        showToast(res?.message || 'Failed to send bulk SMS.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error dispatching bulk SMS.', 'error')
    } finally {
      setIsSendingBulkSms(false)
    }
  }

  // Delete Assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return
    try {
      await api.staff.deleteEventRosterAssignment(assignmentToDelete.roster_id)
      showToast(`Removed ${assignmentToDelete.staff_name} from event roster`, 'info')
      setAssignmentToDelete(null)
      fetchData()
    } catch (err) {
      showToast('Could not delete assignment', 'error')
    }
  }

  // 1-Click Copy Roster Text Summary
  const handleCopyRosterSummary = (eventGroup) => {
    const text = `
📋 EVENT STAFF ROSTER & DISPATCH SHEET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event: ${eventGroup.event_title}
Date: ${eventGroup.event_date} | Service: ${eventGroup.event_time}
Venue: ${eventGroup.event_venue}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Assigned Event Personnel (${eventGroup.assignments.length} Staff):
${eventGroup.assignments.map((a, i) => `${i + 1}. [${a.assigned_role}] ${a.staff_name} | Call Time: ${a.call_time} - ${a.end_time} (${a.status})`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Briefing Notes: Ensure uniform standards, name badges, and arrive promptly at call time.
    `.trim()

    navigator.clipboard.writeText(text)
    showToast(`📋 Copied Staff Roster for "${eventGroup.event_title}"!`, 'success')
  }

  return (
    <div className="space-y-5">
      
      {/* 1. PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">
            Event Staff Scheduling &amp; Roster
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Coordinate catering personnel deployments, station shifts, call times, and conflict safeguards across banquets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl border border-gray-300 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'events'
                  ? 'bg-white text-[#071A3D] shadow-2xs border border-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="material-icons text-sm">celebration</span>
              <span className="hidden sm:inline">By Event</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('personnel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'personnel'
                  ? 'bg-[#C8102E] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="material-icons text-sm">groups</span>
              <span className="hidden sm:inline">By Personnel</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-[#071A3D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="material-icons text-sm">format_list_bulleted</span>
              <span className="hidden sm:inline">All Deployments</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            title="Print Roster Sheet"
          >
            <span className="material-icons text-base">print</span>
            <span className="hidden sm:inline">Print Roster</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base">person_add</span>
            <span>Assign Personnel</span>
          </button>
        </div>
      </header>

      {/* 2. METRICS & KPI SUMMARY CARDS (4 COLS) */}
      {isLoading && rosterList.length === 0 ? (
        <MetricTilesSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Deployments */}
          <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-900 shrink-0">
              <span className="material-icons text-2xl">badge</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">Total Deployments</span>
              <span className="text-xl font-black text-[#071A3D] dark:text-white tracking-tight font-mono">{rosterList.length} Assignments</span>
            </div>
          </div>

          {/* Card 2: Active Personnel */}
          <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 shrink-0">
              <span className="material-icons text-2xl">groups</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">Active Personnel</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono">{staffUsers.length} Staff</span>
            </div>
          </div>

          {/* Card 3: Today On Duty */}
          <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/80 text-[#C8102E] flex items-center justify-center border border-red-200 dark:border-red-900 shrink-0">
              <span className="material-icons text-2xl">work_history</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">Today On Duty</span>
              <span className="text-xl font-black text-[#C8102E] tracking-tight font-mono">
                {rosterList.filter(r => r.event_date === todayStr).length} On Duty
              </span>
            </div>
          </div>

          {/* Card 4: Conflict Monitor */}
          <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shrink-0 ${
              totalConflictsCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
            }`}>
              <span className="material-icons text-2xl">{totalConflictsCount > 0 ? 'event_busy' : 'verified'}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-400 tracking-wider block">Conflict Monitor</span>
                {totalConflictsCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
              </div>
              <span className={`text-xl font-black tracking-tight font-mono ${totalConflictsCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[#071A3D] dark:text-white'}`}>
                {totalConflictsCount === 0 ? '0 Conflicts' : `${totalConflictsCount} Overlaps`}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 3. FILTER, SEARCH & CATEGORY TOOLBAR */}
      <div className="bg-white dark:bg-[#071A3D] p-4 rounded-lg border border-gray-300 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Quick Date Filters & Role Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Schedules', icon: 'all_inclusive' },
              { id: 'today', label: "Today's Roster", icon: 'today' },
              { id: 'upcoming', label: 'Upcoming Events', icon: 'upcoming' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilterDate(f.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                  filterDate === f.id
                    ? 'bg-[#071A3D] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span className="material-icons text-xs">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-gray-300 hidden sm:block"></div>

          {/* Role Filter Selector */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 border border-gray-300 text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">All Assigned Roles</option>
              {EVENT_STAFF_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full md:w-72">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input
            type="text"
            placeholder="Search staff, event, role, venue..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-7 py-2 text-xs rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#C8102E] font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* 4. ROSTER CONTENT VIEW */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <RosterCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="bg-white dark:bg-[#071A3D] p-12 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-center space-y-3 shadow-xs">
          <span className="material-icons text-5xl text-gray-300 dark:text-slate-600 block">badge</span>
          <h3 className="text-base font-black text-[#071A3D] dark:text-white">No Event Staff Schedules Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">
            {searchQuery
              ? `No roster assignments matched "${searchQuery}". Try clearing your search keyword.`
              : 'There are no personnel deployed for the selected date filter.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="px-4 py-2 rounded-lg bg-[#C8102E] text-white text-xs font-black shadow transition hover:bg-[#9B0B21] cursor-pointer inline-flex items-center gap-1.5 mt-2"
          >
            <span className="material-icons text-sm">person_add</span>
            <span>Assign Personnel Now</span>
          </button>
        </div>
      ) : viewMode === 'events' ? (
        
        /* VIEW 1: GROUPED BY EVENT */
        <div className="space-y-4">
          {groupedByEvent.map((grp, idx) => {
            const isToday = grp.event_date === todayStr

            return (
              <div
                key={idx}
                className={`rounded-lg border bg-white dark:bg-[#071A3D] overflow-hidden shadow-xs ${
                  isToday ? 'border-l-[5px] border-l-[#C8102E] border-gray-400 dark:border-slate-700' : 'border-gray-400 dark:border-slate-700'
                }`}
              >
                {/* Event Group Banner */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm sm:text-base text-[#071A3D] dark:text-white">
                        {grp.event_title}
                      </h3>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-100 text-[#C8102E] border border-red-200">
                          ● Today
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                        {grp.assignments.length} Staff Deployed
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap font-medium">
                      <span className="flex items-center gap-1 text-[#071A3D] dark:text-white">
                        <span className="material-icons text-xs text-[#C8102E]">event</span>
                        <strong>{new Date(grp.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-xs text-gray-400">schedule</span>
                        <span>{grp.event_time}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-xs text-gray-400">place</span>
                        <span>{grp.event_venue}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBulkSendSms(grp)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                      title="Send Duty Confirmation SMS to All Staff in this Event"
                    >
                      <span className="material-icons text-sm">sms</span>
                      <span className="hidden sm:inline">Notify Staff (SMS)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyRosterSummary(grp)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-[#C8102E] hover:border-[#C8102E] transition cursor-pointer shadow-2xs"
                      title="Copy Shift Roster Sheet"
                    >
                      <span className="material-icons text-sm block">content_copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal({ id: grp.reservation_id, event_title: grp.event_title, event_date: grp.event_date, event_time: grp.event_time, event_venue: grp.event_venue })}
                      className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <span className="material-icons text-sm">add</span>
                      <span>Add Staff</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Personnel Roster Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/60 dark:bg-slate-900/40 text-gray-400 uppercase text-[9.5px] font-black border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Staff Member</th>
                        <th className="py-2.5 px-4">Assigned Event Role</th>
                        <th className="py-2.5 px-4">Call Time &amp; Shift</th>
                        <th className="py-2.5 px-4">Briefing Instructions</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {grp.assignments.map((item) => {
                        const hasConflict = (conflictMap[`${item.staff_name}_${item.event_date}`] || []).length > 1

                        return (
                          <tr key={item.roster_id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition">
                            <td className="py-3 px-4 font-bold text-[#071A3D] dark:text-white">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#C8102E] dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center justify-center font-black text-xs">
                                  {item.staff_name.charAt(0)}
                                </span>
                                <div>
                                  <span className="block">{item.staff_name}</span>
                                  {hasConflict && (
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                      <span className="material-icons text-xs">warning</span>
                                      Double-booked on this date!
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700">
                                {item.assigned_role}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-gray-700 dark:text-gray-300 text-[11px]">
                              <span>{item.call_time} - {item.end_time}</span>
                            </td>

                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px] max-w-xs truncate font-medium">
                              {item.notes || <span className="text-gray-300 dark:text-gray-600 italic">None</span>}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                  {item.status}
                                </span>
                                {item.last_sms_sent_at ? (
                                  <span
                                    className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5"
                                    title={`Duty SMS Sent at ${new Date(item.last_sms_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                  >
                                    <span className="material-icons text-[10px]">mark_chat_read</span>
                                    <span>SMS Sent</span>
                                  </span>
                                ) : (
                                  <span
                                    className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 flex items-center gap-0.5"
                                    title="Duty SMS not yet sent"
                                  >
                                    <span className="material-icons text-[10px]">sms</span>
                                    <span>Unnotified</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSmsModal(item)}
                                  className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                                  title="Send Duty Confirmation SMS"
                                >
                                  <span className="material-icons text-sm">sms</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(null, item)}
                                  className="p-1 rounded-md text-gray-400 hover:text-blue-600 transition cursor-pointer"
                                  title="Edit Assignment"
                                >
                                  <span className="material-icons text-sm">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAssignmentToDelete(item)}
                                  className="p-1 rounded-md text-gray-400 hover:text-[#C8102E] transition cursor-pointer"
                                  title="Remove Assignment"
                                >
                                  <span className="material-icons text-sm">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      ) : viewMode === 'personnel' ? (

        /* VIEW 2: GROUPED BY PERSONNEL */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedByStaff.map((person, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-gray-400 dark:border-slate-700 bg-white dark:bg-[#071A3D] space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#C8102E] dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center justify-center font-black text-sm">
                    {person.staff_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#071A3D] dark:text-white">
                      {person.staff_name}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {person.staff_role} &bull; {person.assignments.length} Scheduled Event(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
                  Assigned Events &amp; Shifts:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {person.assignments.map((asg) => (
                    <div
                      key={asg.roster_id}
                      className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#071A3D] dark:text-white truncate max-w-[170px]">{asg.event_title}</span>
                        <span className="text-[10px] font-mono text-[#C8102E]">{asg.event_date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-gray-500 dark:text-gray-400 font-medium">
                        <span>Role: <strong className="text-gray-700 dark:text-gray-300">{asg.assigned_role}</strong></span>
                        <span className="font-mono">{asg.call_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormStaffName(person.staff_name)
                  setFormStaffRole(person.staff_role)
                  setIsAssignModalOpen(true)
                }}
                className="w-full py-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-[#C8102E] hover:text-[#C8102E] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-icons text-sm">add</span>
                <span>Assign to Another Event</span>
              </button>
            </div>
          ))}
        </div>
      ) : (

        /* VIEW 3: LINEAR TABLE ROSTER (ALL DEPLOYMENTS) */
        <div className="bg-white dark:bg-[#071A3D] rounded-lg border border-gray-400 dark:border-slate-700 shadow-xs overflow-hidden space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-300 text-gray-400 uppercase text-[9.5px] font-black">
                <tr>
                  <th className="py-3 px-4">Staff Personnel</th>
                  <th className="py-3 px-4">Assigned Catering Event</th>
                  <th className="py-3 px-4">Event Role</th>
                  <th className="py-3 px-4">Call Time &amp; Dismissal</th>
                  <th className="py-3 px-4">Station / Briefing Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRoster.map((item) => {
                  const hasConflict = (conflictMap[`${item.staff_name}_${item.event_date}`] || []).length > 1

                  return (
                    <tr key={item.roster_id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-[#071A3D]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-red-50 text-[#C8102E] border border-red-200 flex items-center justify-center font-black text-xs shrink-0">
                            {item.staff_name.charAt(0)}
                          </span>
                          <div>
                            <span className="block">{item.staff_name}</span>
                            {hasConflict && (
                              <span className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5">
                                <span className="material-icons text-xs">warning</span>
                                Conflict on this date
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-[#071A3D] block">{item.event_title}</span>
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <span className="material-icons text-xs text-[#C8102E]">event</span>
                            {item.event_date} &bull; {item.event_venue}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          {item.assigned_role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-gray-700 text-[11px]">
                        <span>{item.call_time} - {item.end_time}</span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-[11px] max-w-xs truncate font-medium">
                        {item.notes || <span className="text-gray-300 italic">None</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.status}
                          </span>
                          {item.last_sms_sent_at ? (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5"
                              title={`Duty SMS Sent at ${new Date(item.last_sms_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              <span className="material-icons text-[10px]">mark_chat_read</span>
                              <span>SMS Sent</span>
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-0.5"
                              title="Duty SMS not yet sent"
                            >
                              <span className="material-icons text-[10px]">sms</span>
                              <span>Unnotified</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenSmsModal(item)}
                            className="p-1.5 rounded-md bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-600 transition cursor-pointer shadow-2xs"
                            title="Send Duty Confirmation SMS"
                          >
                            <span className="material-icons text-xs">sms</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(null, item)}
                            className="p-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 transition cursor-pointer shadow-2xs"
                            title="Edit Assignment"
                          >
                            <span className="material-icons text-xs text-[#C8102E]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentToDelete(item)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Remove Assignment"
                          >
                            <span className="material-icons text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredRoster.length > itemsPerPage && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredRoster.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemLabel="deployments"
              />
            </div>
          )}
        </div>
      )}

      {/* 5. ASSIGN / EDIT PERSONNEL MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <span className="material-icons text-xl">person_add</span>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#071A3D]">
                    {editingAssignment ? 'Edit Personnel Schedule' : 'Assign Staff to Catering Event'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Set call time, role assignment, and station briefing notes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveAssignment} className="p-4 sm:p-6 space-y-4 text-xs font-medium overflow-y-auto">
              
              {/* Event Link Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">
                  Select Catering Event:
                </label>
                <select
                  value={formEventId}
                  onChange={handleSelectEvent}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                >
                  <option value="">-- Or enter custom event specifications below --</option>
                  {eventsList.map(ev => (
                    <option key={ev.id || ev.reservation_id} value={ev.id || ev.reservation_id}>
                      {ev.event_title || ev.occasion} ({ev.event_date || ev.reservation_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Event Title</label>
                  <input
                    type="text"
                    required
                    value={formEventTitle}
                    onChange={(e) => setFormEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Service Schedule</label>
                  <input
                    type="text"
                    value={formEventTime}
                    onChange={(e) => setFormEventTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Venue / Hall Location</label>
                  <input
                    type="text"
                    value={formEventVenue}
                    onChange={(e) => setFormEventVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                  />
                </div>
              </div>

              {/* Staff Member & Role */}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <span className="text-[10.5px] font-black uppercase text-[#C8102E] tracking-wider block">
                  Personnel &amp; Operational Assignment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">
                      Staff Member Name <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      type="text"
                      list="admin-staff-name-suggestions"
                      required
                      placeholder="Enter staff member's full name..."
                      value={formStaffName}
                      onChange={handleStaffNameChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                    />
                    <datalist id="admin-staff-name-suggestions">
                      {staffUsers.map(u => (
                        <option key={u.user_id} value={u.full_name || u.username}>
                          {u.role ? `(${u.role})` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Assigned Event Role</label>
                    <select
                      value={formAssignedRole}
                      onChange={(e) => setFormAssignedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                    >
                      {EVENT_STAFF_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Call / Report Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:30 AM"
                      value={formCallTime}
                      onChange={(e) => setFormCallTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">End / Dismissal Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 04:00 PM"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">
                      Staff Mobile Number (SMS)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +639067236264 or 09067236264"
                      value={formPhoneNumber}
                      onChange={(e) => setFormPhoneNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                    />
                  </div>
                  <div className="flex items-center pt-2 sm:pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formSendSmsImmediately}
                        onChange={(e) => setFormSendSmsImmediately(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]"
                      />
                      <span className="text-xs font-bold text-gray-700">
                        Dispatch duty SMS immediately upon saving
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider block">Briefing Instructions &amp; Station Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Assigned to VIP head table and beverage refilling station."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {editingAssignment ? 'Save Changes' : 'Confirm Assignment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. CONFIRM DELETE MODAL */}
      {assignmentToDelete && (
        <ConfirmationModal
          isOpen={Boolean(assignmentToDelete)}
          title="Remove Staff Assignment"
          message={`Are you sure you want to remove "${assignmentToDelete.staff_name}" from the roster for "${assignmentToDelete.event_title}"?`}
          confirmLabel="Remove Assignment"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={handleDeleteAssignment}
          onCancel={() => setAssignmentToDelete(null)}
        />
      )}

      {/* 7. SEND ON-DUTY SMS CONFIRMATION MODAL */}
      {smsModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#071A3D] rounded-2xl border border-gray-300 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <span className="material-icons text-xl">textsms</span>
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#071A3D] dark:text-white">
                    Send Duty SMS Confirmation
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Notify staff member via mobile SMS that they are confirmed on duty
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmsModalAssignment(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmSendSms} className="p-4 sm:p-6 space-y-4 text-xs font-medium overflow-y-auto">
              {/* Staff & Event Card */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-[#C8102E] font-black text-xs flex items-center justify-center">
                      {smsModalAssignment.staff_name.charAt(0)}
                    </span>
                    <div>
                      <span className="font-black text-sm text-[#071A3D] dark:text-white block">
                        {smsModalAssignment.staff_name}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">
                        {smsModalAssignment.assigned_role}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {smsModalAssignment.status || 'Confirmed'}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Event</span>
                    <strong className="text-gray-700 dark:text-gray-300">{smsModalAssignment.event_title}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Call Time</span>
                    <strong className="text-gray-700 dark:text-gray-300 font-mono">{smsModalAssignment.call_time} - {smsModalAssignment.end_time}</strong>
                  </div>
                </div>

                {smsModalAssignment.last_sms_sent_at && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                    <span className="material-icons text-xs">history</span>
                    <span>Last sent: {new Date(smsModalAssignment.last_sms_sent_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Recipient Phone Number Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider block">
                  Staff Mobile Number (SMS Recipient) *
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">phone_iphone</span>
                  <input
                    type="text"
                    required
                    value={smsPhoneNumber}
                    onChange={(e) => setSmsPhoneNumber(e.target.value)}
                    placeholder="e.g. +639067236264 or 09067236264"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Sends via Jo's Diner SMS Gateway directly to the staff member's mobile device.
                </p>
              </div>

              {/* SMS Message Content Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider block">
                    SMS Message Content Preview
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {smsCustomMessage.length} chars
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={smsCustomMessage}
                  onChange={(e) => setSmsCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-hidden transition leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSmsModalAssignment(null)}
                  disabled={isSendingSms}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className={`material-icons text-sm ${isSendingSms ? 'animate-spin' : ''}`}>
                    {isSendingSms ? 'refresh' : 'send'}
                  </span>
                  <span>{isSendingSms ? 'Sending SMS...' : 'Send SMS Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. BULK SMS CONFIRMATION MODAL */}
      {bulkSmsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#071A3D] rounded-2xl border border-gray-300 dark:border-slate-700 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <span className="material-icons text-2xl">sms</span>
              </div>
              <div>
                <h3 className="font-black text-base text-[#071A3D] dark:text-white">Notify All Assigned Staff</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send on-duty SMS confirmations to entire event crew</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 text-xs space-y-1.5">
              <div className="font-black text-sm text-[#071A3D] dark:text-white">{bulkSmsEvent.event_title}</div>
              <div className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                📅 {new Date(bulkSmsEvent.event_date).toLocaleDateString()} &bull; ⏰ {bulkSmsEvent.event_time}
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-slate-800 flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>Total Personnel Deployed:</span>
                <span>{bulkSmsEvent.assignments.length} Staff Members</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Each staff member will receive an individual SMS with their call time, assigned role, and event venue instructions.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBulkSmsEvent(null)}
                disabled={isSendingBulkSms}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkSms}
                disabled={isSendingBulkSms}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className={`material-icons text-sm ${isSendingBulkSms ? 'animate-spin' : ''}`}>
                  {isSendingBulkSms ? 'refresh' : 'send'}
                </span>
                <span>{isSendingBulkSms ? 'Sending to All...' : `Send SMS to ${bulkSmsEvent.assignments.length} Staff`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default EventStaffSchedulingPage

