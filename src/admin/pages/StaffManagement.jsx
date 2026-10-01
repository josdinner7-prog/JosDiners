import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import ConfirmationModal from '../components/ConfirmationModal'
import api from '../../services/api'

function StaffManagement(props) {
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  // State Management
  const [personnelRoster, setPersonnelRoster] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [staffSearch, setStaffSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal States
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false)
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false)
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffToDelete, setStaffToDelete] = useState(null)
  const [isDeletingStaff, setIsDeletingStaff] = useState(false)

  // Form Fields for Add / Edit
  const [formUsername, setFormUsername] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formRole, setFormRole] = useState('staff')
  const [formTitle, setFormTitle] = useState('Front Desk Cashier')
  const [formPassword, setFormPassword] = useState('password123')
  const [formPhone, setFormPhone] = useState('')
  const [formVehicle, setFormVehicle] = useState('Motorcycle')
  const [formPlate, setFormPlate] = useState('')
  const [formRiderStatus, setFormRiderStatus] = useState('Available')

  // Form Fields for Shift Roster
  const [formShiftName, setFormShiftName] = useState('Morning Shift')
  const [formShiftHours, setFormShiftHours] = useState('06:00 AM - 02:00 PM')
  const [formShiftDays, setFormShiftDays] = useState('Mon - Fri')
  const [formShiftStatus, setFormShiftStatus] = useState('On Shift')

  useEffect(() => {
    fetchStaffUsers()
  }, [])

  const fetchStaffUsers = async () => {
    setIsLoading(true)
    try {
      const data = await api.staff.getUsers()
      if (data.status === 'success' && Array.isArray(data.users)) {
        const enriched = data.users
          .filter(u => u.role !== 'admin')
          .map((u) => ({
            ...u,
            title: u.title || (u.role === 'kitchen' ? 'Kitchen Chef' : u.role === 'rider' ? 'Delivery Courier' : 'Front Desk Staff'),
            shift_name: u.shift_name || 'Day Shift',
            shift_hours: u.shift_hours || '08:00 AM - 05:00 PM',
            shift_days: u.shift_days || 'Mon - Fri',
            shift_status: u.shift_status || 'On Shift',
            vehicle_type: u.vehicle_type || 'Motorcycle',
            plate_number: u.plate_number || '',
            rider_status: u.rider_status || 'Available',
            employee_code: u.role === 'rider' ? `RIDER-${String(u.user_id).padStart(3, '0')}` : `STAFF-${String(u.user_id).padStart(3, '0')}`
          }))

        setPersonnelRoster(enriched)
      } else {
        setPersonnelRoster([])
      }
    } catch (e) {
      setPersonnelRoster([])
      showToast('Could not load staff roster from database.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Modal Handlers
  const handleOpenAddModal = () => {
    setFormUsername('')
    setFormFullName('')
    setFormRole('staff')
    setFormTitle('Front Desk Cashier')
    setFormPassword('password123')
    setFormPhone('+63 917 555 0000')
    setFormVehicle('Honda Beat 125cc')
    setFormPlate('')
    setFormRiderStatus('Available')
    setFormShiftName('Morning Shift')
    setFormShiftHours('06:00 AM - 02:00 PM')
    setFormShiftDays('Mon - Fri')
    setFormShiftStatus('On Shift')
    setIsAddStaffModalOpen(true)
  }

  const handleOpenEditModal = (staff) => {
    setSelectedStaff(staff)
    setFormUsername(staff.username || '')
    setFormFullName(staff.full_name || '')
    setFormRole(staff.role || 'staff')
    setFormTitle(staff.title || 'Staff Member')
    setFormPhone(staff.phone_number || '')
    setFormVehicle(staff.vehicle_type || 'Motorcycle')
    setFormPlate(staff.plate_number || '')
    setFormRiderStatus(staff.rider_status || 'Available')
    setFormShiftStatus(staff.shift_status || 'On Shift')
    setIsEditStaffModalOpen(true)
  }

  const handleOpenRosterModal = (staff) => {
    setSelectedStaff(staff)
    setFormShiftName(staff.shift_name || 'Morning Shift')
    setFormShiftHours(staff.shift_hours || '06:00 AM - 02:00 PM')
    setFormShiftDays(staff.shift_days || 'Mon - Fri')
    setFormShiftStatus(staff.shift_status || 'On Shift')
    setIsRosterModalOpen(true)
  }

  // Create Staff Account Submit
  const handleCreateStaffUser = async (e) => {
    e.preventDefault()
    if (!formFullName.trim()) {
      showToast("Staff member's full name is required!", 'error')
      return
    }
    if (!formUsername.trim()) {
      showToast('Staff username is required!', 'error')
      return
    }

    const payload = {
      username: formUsername.trim(),
      full_name: formFullName.trim(),
      role: formRole,
      title: formTitle.trim() || (formRole === 'kitchen' ? 'Kitchen Chef' : formRole === 'rider' ? 'Delivery Courier' : 'Front Desk Staff'),
      password: formPassword || 'password123',
      phone_number: formPhone.trim(),
      vehicle_type: formVehicle.trim(),
      plate_number: formPlate.trim(),
      rider_status: formRiderStatus,
      shift_name: formShiftName,
      shift_hours: formShiftHours,
      shift_days: formShiftDays,
      shift_status: formShiftStatus
    }

    try {
      const data = await api.staff.createUser(payload)
      if (data.status === 'success') {
        showToast(`${formRole === 'rider' ? 'Rider' : 'Staff'} account for "${formFullName || formUsername}" created!`, 'success')
        fetchStaffUsers()
        setIsAddStaffModalOpen(false)
      } else {
        showToast(data.message || 'Error creating user', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Could not connect to server.', 'error')
    }
  }

  // Update Staff Details Submit
  const handleEditStaffUser = async (e) => {
    e.preventDefault()
    if (!selectedStaff) return

    const payload = {
      username: formUsername.trim(),
      full_name: formFullName.trim(),
      role: formRole,
      title: formTitle.trim(),
      phone_number: formPhone.trim(),
      vehicle_type: formVehicle.trim(),
      plate_number: formPlate.trim(),
      rider_status: formRiderStatus,
      shift_status: formShiftStatus
    }

    try {
      const data = await api.staff.updateUser(selectedStaff.user_id, payload)
      if (data.status === 'success') {
        showToast(`Updated account for "${formFullName || formUsername}"!`, 'success')
        fetchStaffUsers()
        setIsEditStaffModalOpen(false)
      } else {
        showToast(data.message || 'Failed to update staff account.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Save Shift Roster Submit
  const handleSaveShiftRoster = async (e) => {
    e.preventDefault()
    if (!selectedStaff) return

    const payload = {
      shift_name: formShiftName,
      shift_hours: formShiftHours,
      shift_days: formShiftDays,
      shift_status: formShiftStatus
    }

    try {
      const data = await api.staff.updateUser(selectedStaff.user_id, payload)
      if (data.status === 'success') {
        showToast(`Updated work shift roster for "${selectedStaff.full_name || selectedStaff.username}"!`, 'success')
        fetchStaffUsers()
        setIsRosterModalOpen(false)
      } else {
        showToast(data.message || 'Failed to update shift roster.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Toggle Shift Status Directly
  const handleToggleStaffShift = async (user_id) => {
    const targetUser = personnelRoster.find(u => u.user_id === user_id)
    if (!targetUser) return
    const nextStatus = targetUser.shift_status === 'Off Shift' ? 'On Shift' : 'Off Shift'

    try {
      const data = await api.staff.updateUser(user_id, { shift_status: nextStatus })
      if (data.status === 'success') {
        showToast(`Shift status for "${targetUser.username}" set to ${nextStatus}!`, 'info')
        fetchStaffUsers()
      } else {
        showToast(data.message || 'Failed to update shift status.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Delete Staff User
  const handleDeleteStaff = (user_id, username) => {
    setStaffToDelete({ user_id, username })
  }

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return
    setIsDeletingStaff(true)
    try {
      const data = await api.staff.deleteUser(staffToDelete.user_id)
      if (data.status === 'success') {
        showToast(`Staff user "${staffToDelete.username}" deleted from database!`, 'info')
        setStaffToDelete(null)
        fetchStaffUsers()
      } else {
        showToast(data.message || 'Failed to remove staff user.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    } finally {
      setIsDeletingStaff(false)
    }
  }

  // Filter Logic
  const activeSearch = staffSearch || searchQuery

  const filteredStaff = personnelRoster.filter(u => {
    const name = (u.full_name || '').toLowerCase()
    const uname = (u.username || '').toLowerCase()
    const title = (u.title || '').toLowerCase()
    const code = (u.employee_code || '').toLowerCase()
    const searchMatch = name.includes(activeSearch.toLowerCase()) ||
      uname.includes(activeSearch.toLowerCase()) ||
      title.includes(activeSearch.toLowerCase()) ||
      code.includes(activeSearch.toLowerCase())

    if (!searchMatch) return false

    if (roleFilter === 'staff') return u.role === 'staff'
    if (roleFilter === 'kitchen') return u.role === 'kitchen'
    if (roleFilter === 'rider') return u.role === 'rider'
    if (roleFilter === 'on_shift') return u.shift_status === 'On Shift'
    if (roleFilter === 'off_shift') return u.shift_status === 'Off Shift'

    return true
  })

  // Metric Counts
  const totalStaffCount = personnelRoster.length
  const onShiftCount = personnelRoster.filter(u => u.shift_status === 'On Shift').length
  const frontDeskCount = personnelRoster.filter(u => u.role === 'staff').length
  const kitchenCount = personnelRoster.filter(u => u.role === 'kitchen').length
  const riderCount = personnelRoster.filter(u => u.role === 'rider').length

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage))
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Preset Shift Schedules Helper
  const applyPresetShift = (preset) => {
    if (preset === 'morning') {
      setFormShiftName('Morning Shift')
      setFormShiftHours('06:00 AM - 02:00 PM')
      setFormShiftDays('Mon - Fri')
    } else if (preset === 'mid') {
      setFormShiftName('Mid Shift')
      setFormShiftHours('10:00 AM - 06:00 PM')
      setFormShiftDays('Mon - Fri')
    } else if (preset === 'closing') {
      setFormShiftName('Closing Shift')
      setFormShiftHours('02:00 PM - 10:00 PM')
      setFormShiftDays('Tue - Sun')
    } else if (preset === 'weekend') {
      setFormShiftName('Weekend Shift')
      setFormShiftHours('08:00 AM - 08:00 PM')
      setFormShiftDays('Sat - Sun')
    }
  }

  const [viewMode, setViewMode] = useState('table') // 'table' or 'calendar'

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Staff Management &amp; Shift Roster</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage employee accounts, assign work shifts, edit roles, track on/off duty status, and configure weekly roster schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl border border-gray-300 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${viewMode === 'table'
                ? 'bg-white text-[#071A3D] shadow-2xs border border-gray-300'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-icons text-sm">format_list_bulleted</span>
              <span className="hidden sm:inline">Table Roster</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${viewMode === 'calendar'
                ? 'bg-[#C8102E] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="material-icons text-sm">calendar_month</span>
              <span>Weekly Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/staff-schedule')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base">schedule_send</span>
            <span>Event Staff Roster</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base">person_add</span>
            <span className="hidden sm:inline">Add Staff Account</span>
          </button>
        </div>
      </header>

      {/* METRICS & KPI SUMMARY CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <span className="material-icons text-2xl">badge</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Personnel</span>
            <span className="text-xl font-black text-[#071A3D] tracking-tight">{totalStaffCount} Employees</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <span className="material-icons text-2xl">event_available</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">On Duty Now</span>
            <span className="text-xl font-black text-emerald-700 tracking-tight">{onShiftCount} On Shift</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
            <span className="material-icons text-2xl">point_of_sale</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Front Counter Team</span>
            <span className="text-xl font-black text-indigo-900 tracking-tight">{frontDeskCount} Staff</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
            <span className="material-icons text-2xl">soup_kitchen</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Kitchen KDS Team</span>
            <span className="text-xl font-black text-amber-900 tracking-tight">{kitchenCount} Chefs</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-400 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="material-icons text-sm text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            placeholder="Search staff name, username, or title..."
            value={staffSearch}
            onChange={(e) => {
              setStaffSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E]"
          />
          {staffSearch && (
            <button
              onClick={() => setStaffSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-icons text-xs">close</span>
            </button>
          )}
        </div>

        {/* Role & Shift Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `All (${totalStaffCount})` },
            { id: 'staff', label: `Front Desk (${frontDeskCount})` },
            { id: 'kitchen', label: `Kitchen (${kitchenCount})` },
            { id: 'rider', label: `Riders (${riderCount})` },
            { id: 'on_shift', label: `On Shift (${onShiftCount})` },
            { id: 'off_shift', label: `Off Shift (${totalStaffCount - onShiftCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setRoleFilter(tab.id)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${roleFilter === tab.id
                ? 'bg-[#071A3D] text-white border-[#071A3D] shadow-xs'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW CONDITIONAL: TABLE VS WEEKLY CALENDAR VIEW */}
      {viewMode === 'table' ? (
        <>
          {/* STAFF ROSTER DIRECTORY TABLE */}
          <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
                  <tr>
                    <th className="p-3.5">Employee & Account</th>
                    <th className="p-3.5">System Role & Title</th>
                    <th className="p-3.5">Work Shift Roster</th>
                    <th className="p-3.5">Duty Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-400 font-bold">
                        <div className="w-8 h-8 rounded-full border-2 border-[#C8102E] border-t-transparent animate-spin mx-auto mb-2" />
                        <span>Loading staff roster from database...</span>
                      </td>
                    </tr>
                  ) : paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                          <span className="material-icons text-2xl">badge</span>
                        </div>
                        <p className="text-sm font-black text-[#071A3D]">No Staff Personnel Found</p>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          No employee account matches your search criteria or selected filter tab.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((u) => {
                      const name = u.full_name || u.username
                      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      const isOnShift = u.shift_status === 'On Shift'
                      const isKitchen = u.role === 'kitchen'
                      const isRider = u.role === 'rider'

                      return (
                        <tr key={u.user_id} className="hover:bg-gray-50/70 transition">
                          {/* Employee Info */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center border shrink-0 ${
                                isRider 
                                  ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
                                  : isKitchen 
                                  ? 'bg-amber-900 text-amber-200 border-amber-700' 
                                  : 'bg-blue-900 text-blue-200 border-blue-700'
                              }`}>
                                {isRider ? '🛵' : initials}
                              </div>
                              <div className="min-w-0">
                                <span className="font-black text-sm text-[#071A3D] block truncate">{name}</span>
                                <span className="text-[10px] text-gray-400 font-mono block">@{u.username} • {u.employee_code}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Title */}
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-block ${
                                isRider
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : isKitchen
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-blue-50 text-blue-900 border-blue-300'
                                }`}>
                                {isRider ? 'Delivery Rider' : isKitchen ? 'Kitchen / Chef' : 'Front Counter / Cashier'}
                              </span>
                              <span className="text-gray-700 font-bold text-xs block truncate">{u.title}</span>
                              {isRider && (
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {u.vehicle_type} ({u.plate_number || 'No Plate'})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Work Shift Roster */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-black text-[#071A3D] block truncate flex items-center gap-1">
                                <span className="material-icons text-xs text-amber-600">schedule</span>
                                <span>{u.shift_name} ({u.shift_hours})</span>
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 block flex items-center gap-1">
                                <span className="material-icons text-[11px] text-gray-400">calendar_today</span>
                                <span>{u.shift_days}</span>
                              </span>
                            </div>
                          </td>

                          {/* Shift Status Toggle */}
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStaffShift(u.user_id)}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition active:scale-95 cursor-pointer flex items-center gap-1 ${isOnShift
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                              title="Click to toggle on/off shift"
                            >
                              <span>{isOnShift ? '● ON SHIFT' : '○ OFF SHIFT'}</span>
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenRosterModal(u)}
                                className="px-2 py-1 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-xs font-bold text-gray-700 transition cursor-pointer shadow-2xs flex items-center gap-1"
                                title="Assign & Edit Work Shift Roster"
                              >
                                <span className="material-icons text-xs text-emerald-600">calendar_month</span>
                                <span>Roster</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(u)}
                                className="p-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 transition cursor-pointer shadow-2xs"
                                title="Edit Staff Account"
                              >
                                <span className="material-icons text-xs text-[#C8102E]">edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(u.user_id, u.username)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition cursor-pointer"
                                title="Remove Staff Account"
                              >
                                <span className="material-icons text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION CONTROLS */}
          {filteredStaff.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStaff.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              itemLabel="staff personnel"
            />
          )}
        </>
      ) : (
        /* WEEKLY SHIFT ROSTER CALENDAR VIEW GRID */
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-gray-400 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons text-lg text-[#C8102E]">event</span>
              <span className="text-xs font-black text-[#071A3D]">Weekly Staff Schedule Grid</span>
              <span className="text-[10px] text-gray-500 font-medium">Click any shift card to edit roster assignment</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Front Desk</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Kitchen KDS</span>
            </div>
          </div>

          {/* 7-Day Calendar Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { id: 'mon', short: 'Mon', name: 'Monday' },
              { id: 'tue', short: 'Tue', name: 'Tuesday' },
              { id: 'wed', short: 'Wed', name: 'Wednesday' },
              { id: 'thu', short: 'Thu', name: 'Thursday' },
              { id: 'fri', short: 'Fri', name: 'Friday' },
              { id: 'sat', short: 'Sat', name: 'Saturday' },
              { id: 'sun', short: 'Sun', name: 'Sunday' }
            ].map((dayObj, dayIdx) => {
              const dayStaff = filteredStaff.filter(u => {
                const daysText = (u.shift_days || 'Mon - Fri').toLowerCase()
                if (daysText.includes('daily') || daysText.includes('everyday')) return true
                if (daysText.includes('weekend')) return dayIdx === 5 || dayIdx === 6
                if (daysText.includes('mon - fri') || daysText.includes('mon-fri')) return dayIdx >= 0 && dayIdx <= 4
                if (daysText.includes('tue - sun') || daysText.includes('tue-sun')) return dayIdx >= 1 && dayIdx <= 6
                const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                return daysText.includes(dayNames[dayIdx])
              })

              return (
                <div key={dayObj.id} className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden flex flex-col min-h-[320px]">
                  {/* Column Header */}
                  <div className="bg-gray-100 p-2.5 text-center border-b border-gray-300">
                    <span className="text-xs font-black text-[#071A3D] block uppercase tracking-wider">{dayObj.name}</span>
                    <span className="text-[10px] text-gray-500 font-bold block">{dayStaff.length} Scheduled</span>
                  </div>

                  {/* Scheduled Staff Cards List */}
                  <div className="p-2 space-y-2 flex-1 bg-gray-50/40 overflow-y-auto max-h-[420px]">
                    {dayStaff.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 font-bold text-[10px]">
                        No shift scheduled
                      </div>
                    ) : (
                      dayStaff.map(u => {
                        const name = u.full_name || u.username
                        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        const isKitchen = u.role === 'kitchen'
                        const isOnShift = u.shift_status === 'On Shift'

                        return (
                          <div
                            key={u.user_id}
                            onClick={() => handleOpenRosterModal(u)}
                            className={`p-2 rounded-lg border transition cursor-pointer hover:shadow-md ${isKitchen
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                              : 'bg-blue-50/90 border-blue-300 text-blue-950'
                              }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center text-white shrink-0 ${isKitchen ? 'bg-amber-800' : 'bg-blue-800'}`}>
                                {initials}
                              </div>
                              <span className="font-black text-[11px] truncate flex-1">{name}</span>
                            </div>

                            <span className="text-[9px] font-bold text-gray-600 block truncate mb-1">
                              {u.title}
                            </span>

                            <div className="flex items-center justify-between text-[9px] pt-1 border-t border-black/10">
                              <span className="font-mono font-bold text-gray-700 flex items-center gap-0.5">
                                <span className="material-icons text-[10px]">schedule</span>
                                <span>{u.shift_hours.split(' ')[0]}</span>
                              </span>

                              <span className={`font-black text-[8px] uppercase ${isOnShift ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {isOnShift ? '● On Duty' : '○ Off'}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* REGISTER STAFF ACCOUNT MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">person_add</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Register Staff Account</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Create a new employee user account & assign shift roster</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleCreateStaffUser} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div className="grid grid-cols-2 gap-3">
                {/* Staff Member's Name */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Staff Member's Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Username / System ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. chef_juan"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* System Role */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">System Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => {
                      setFormRole(e.target.value)
                      if (e.target.value === 'kitchen') setFormTitle('Kitchen Chef')
                      else if (e.target.value === 'rider') setFormTitle('Delivery Courier')
                      else setFormTitle('Front Desk Cashier')
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="staff">Front Desk / Cashier</option>
                    <option value="kitchen">Kitchen / KDS Chef</option>
                    <option value="rider">Delivery Rider / Courier</option>
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Job Title / Position</label>
                  <input
                    type="text"
                    placeholder="Front Desk Staff"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              {/* Rider Specific Details (When role is rider) */}
              {formRole === 'rider' && (
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-300 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                    🛵 Rider Vehicle & Contact Details
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-gray-700 font-bold mb-0.5 text-[10px]">Mobile Phone</label>
                      <input
                        type="tel"
                        placeholder="+63 9XX..."
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-0.5 text-[10px]">Vehicle Info</label>
                      <input
                        type="text"
                        placeholder="e.g. Honda Beat 125"
                        value={formVehicle}
                        onChange={(e) => setFormVehicle(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-0.5 text-[10px]">Plate #</label>
                      <input
                        type="text"
                        placeholder="MC-1234-VR"
                        value={formPlate}
                        onChange={(e) => setFormPlate(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-gray-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Initial Password</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-mono text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Default Shift Roster Assignment */}
              <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">Initial Shift Roster Assignment</span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Shift Name</label>
                    <input
                      type="text"
                      value={formShiftName}
                      onChange={(e) => setFormShiftName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[10px]">Work Hours</label>
                    <input
                      type="text"
                      value={formShiftHours}
                      onChange={(e) => setFormShiftHours(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-300 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">person_add</span>
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF ACCOUNT MODAL */}
      {isEditStaffModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">edit</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Edit Staff Account</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Update account details for ID #{selectedStaff.user_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStaffModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleEditStaffUser} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Username *</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Full Name</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="staff">Front Desk / Cashier</option>
                    <option value="kitchen">Kitchen / KDS Chef</option>
                    <option value="rider">Delivery Rider / Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-[11px]">Job Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Shift Duty Status</label>
                <select
                  value={formShiftStatus}
                  onChange={(e) => setFormShiftStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                >
                  <option value="On Shift">On Shift (On Duty)</option>
                  <option value="Off Shift">Off Shift (Off Duty)</option>
                </select>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsEditStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">save</span>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE WORK SHIFT ROSTER MODAL */}
      {isRosterModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-300 shrink-0">
                  <span className="material-icons text-base">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Assign Work Shift Roster</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Configure schedule for {selectedStaff.full_name || selectedStaff.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleSaveShiftRoster} className="p-5 space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* Quick Shift Presets Bar */}
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-[11px]">Quick Shift Presets</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetShift('morning')}
                    className="p-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-[10px] font-bold text-gray-700 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="material-icons text-xs text-amber-500">light_mode</span>
                    <span>Morning (06 AM - 02 PM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetShift('mid')}
                    className="p-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-[10px] font-bold text-gray-700 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="material-icons text-xs text-blue-500">wb_sunny</span>
                    <span>Mid Shift (10 AM - 06 PM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetShift('closing')}
                    className="p-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-[10px] font-bold text-gray-700 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="material-icons text-xs text-indigo-500">dark_mode</span>
                    <span>Closing (02 PM - 10 PM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetShift('weekend')}
                    className="p-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-[10px] font-bold text-gray-700 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span className="material-icons text-xs text-purple-500">weekend</span>
                    <span>Weekend (Sat - Sun)</span>
                  </button>
                </div>
              </div>

              {/* Shift Title Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Shift Title / Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Shift"
                  value={formShiftName}
                  onChange={(e) => setFormShiftName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Shift Working Hours */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Working Hours *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:00 AM - 02:00 PM"
                  value={formShiftHours}
                  onChange={(e) => setFormShiftHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Scheduled Days */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Scheduled Work Days *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mon - Fri or Tue - Sun"
                  value={formShiftDays}
                  onChange={(e) => setFormShiftDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Shift Status */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Shift Status</label>
                <select
                  value={formShiftStatus}
                  onChange={(e) => setFormShiftStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                >
                  <option value="On Shift">On Shift (Active Duty)</option>
                  <option value="Off Shift">Off Shift (Off Duty)</option>
                </select>
              </div>

              {/* Live Shift Summary Card */}
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-300 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Assigned Roster Summary</span>
                <p className="text-xs font-black text-emerald-950">{formShiftName} ({formShiftHours})</p>
                <p className="text-[11px] font-bold text-emerald-800">{formShiftDays} • Status: {formShiftStatus}</p>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">event_available</span>
                  <span>Save Roster Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDeleteStaff}
        title={`Remove Staff Account?`}
        message={`Are you sure you want to permanently remove the account for "${staffToDelete?.username}"? They will no longer be able to log in to the POS or staff dashboard.`}
        confirmText="Yes, Remove Staff"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingStaff}
      />
    </div>
  )
}

export default StaffManagement
