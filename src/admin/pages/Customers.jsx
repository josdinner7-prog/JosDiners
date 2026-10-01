import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import api from '../../services/api'

function Customers(props) {
  const context = useOutletContext() || {}
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  // State Management
  const [customersList, setCustomersList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [customerSearch, setCustomerSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'vip', 'active', 'unverified'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPassword, setFormPassword] = useState('password123')
  const [formPicture, setFormPicture] = useState('')
  const [formIsVerified, setFormIsVerified] = useState(1)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const data = await api.customers.getCustomers()
      if (data.status === 'success' && data.customers) {
        setCustomersList(data.customers)
      } else {
        setCustomersList([])
      }
    } catch (e) {
      setCustomersList([])
      showToast('Could not fetch customer directory from server.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Image Upload for Customer Profile
  const handleImageFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 550
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.55)
          setFormPicture(compressed)
          showToast('Profile photo compressed & loaded!', 'success')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // Modal Handlers
  const handleOpenAddModal = () => {
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormPassword('password123')
    setFormPicture('')
    setFormIsVerified(1)
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer)
    setFormName(customer.name || customer.full_name || '')
    setFormEmail(customer.email || '')
    setFormPhone(customer.phone || customer.phone_number || '')
    setFormPicture(customer.profile_picture || '')
    setFormIsVerified(customer.is_verified ? 1 : 0)
    setIsEditModalOpen(true)
  }

  const handleOpenViewModal = (customer) => {
    setSelectedCustomer(customer)
    setIsViewModalOpen(true)
  }

  // Create Customer Submit
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim()) {
      showToast('Name and Email are required.', 'error')
      return
    }

    try {
      const payload = {
        full_name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        password: formPassword,
        profile_picture: formPicture
      }
      const data = await api.customers.createCustomer(payload)
      if (data.status === 'success') {
        showToast(`Customer "${formName}" registered successfully!`, 'success')
        fetchCustomers()
        setIsAddModalOpen(false)
      } else {
        showToast(data.message || 'Error registering customer.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Update Customer Submit
  const handleEditCustomerSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      const payload = {
        full_name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        profile_picture: formPicture,
        is_verified: formIsVerified
      }
      const data = await api.customers.updateCustomer(selectedCustomer.customer_id, payload)
      if (data.status === 'success') {
        showToast(`Updated customer profile for "${formName}"!`, 'success')
        fetchCustomers()
        setIsEditModalOpen(false)
      } else {
        showToast(data.message || 'Failed to update customer.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Delete Customer
  const handleDeleteCustomer = async (customer_id, full_name) => {
    if (!window.confirm(`Are you sure you want to delete customer record for "${full_name}"?`)) return

    try {
      const data = await api.customers.deleteCustomer(customer_id)
      if (data.status === 'success') {
        showToast(`Customer "${full_name}" deleted from database.`, 'info')
        fetchCustomers()
      } else {
        showToast(data.message || 'Failed to delete customer record.', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to server.', 'error')
    }
  }

  // Filter Logic
  const activeSearch = customerSearch || searchQuery

  const filteredCustomers = customersList.filter(cust => {
    const name = (cust.name || cust.full_name || '').toLowerCase()
    const email = (cust.email || '').toLowerCase()
    const phone = (cust.phone || cust.phone_number || '').toLowerCase()
    const searchMatch = name.includes(activeSearch.toLowerCase()) ||
                        email.includes(activeSearch.toLowerCase()) ||
                        phone.includes(activeSearch.toLowerCase())

    if (!searchMatch) return false

    if (statusFilter === 'vip') {
      return (cust.total_spent || 0) >= 15000
    }
    if (statusFilter === 'active') {
      return cust.is_verified === 1 && (cust.total_spent || 0) < 15000
    }
    if (statusFilter === 'unverified') {
      return !cust.is_verified || cust.is_verified === 0
    }

    return true
  })

  // KPI Counts
  const totalCustomersCount = customersList.length
  const verifiedCount = customersList.filter(c => c.is_verified === 1).length
  const vipCount = customersList.filter(c => (c.total_spent || 0) >= 15000).length
  const totalRevenue = customersList.reduce((acc, c) => acc + (parseFloat(c.total_spent) || 0), 0)

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage))
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Customer Management</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage registered diner accounts, contact info, verification status, total spend, and order history.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
        >
          <span className="material-icons text-base">add_circle</span>
          <span>Register Customer</span>
        </button>
      </header>

      {/* METRICS & SUMMARY CARDS (4 COLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <span className="material-icons text-2xl">groups</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Total Customers</span>
            <span className="text-xl font-black text-[#071A3D] tracking-tight">{totalCustomersCount} Accounts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <span className="material-icons text-2xl">verified</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Verified Diners</span>
            <span className="text-xl font-black text-emerald-700 tracking-tight">{verifiedCount} Verified</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
            <span className="material-icons text-2xl">stars</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">VIP Clients</span>
            <span className="text-xl font-black text-amber-900 tracking-tight">{vipCount} VIPs</span>
          </div>
        </div>

        <div className="bg-[#071A3D] p-4 rounded-lg border border-gray-400 shadow-xs flex items-center gap-3 text-white">
          <div className="w-12 h-12 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center border border-white/20 shrink-0">
            <span className="material-icons text-2xl">payments</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider block">Total Customer Revenue</span>
            <span className="text-xl font-black text-amber-400 tracking-tight font-mono">₱{totalRevenue.toLocaleString()}</span>
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
            placeholder="Search name, email, or phone..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#C8102E]"
          />
          {customerSearch && (
            <button
              onClick={() => setCustomerSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-icons text-xs">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: `All (${totalCustomersCount})` },
            { id: 'vip', label: `VIP Clients (${vipCount})` },
            { id: 'active', label: `Active (${verifiedCount - vipCount})` },
            { id: 'unverified', label: `Unverified (${totalCustomersCount - verifiedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${statusFilter === tab.id
                ? 'bg-[#071A3D] text-white border-[#071A3D] shadow-xs'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMER DIRECTORY TABLE */}
      <div className="bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-600 font-black uppercase tracking-wider border-b border-gray-300">
              <tr>
                <th className="p-3.5">Customer Profile</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Orders & Lifetime Spend</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400 font-bold">
                    <div className="w-8 h-8 rounded-full border-2 border-[#C8102E] border-t-transparent animate-spin mx-auto mb-2" />
                    <span>Loading customer directory from MariaDB database...</span>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex items-center justify-center border border-red-200 mx-auto">
                      <span className="material-icons text-2xl">person_search</span>
                    </div>
                    <p className="text-sm font-black text-[#071A3D]">No Customer Profiles Found</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      No customer account matches your search parameters or selected tab filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const name = c.name || c.full_name || 'Anonymous Customer'
                  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  const isVip = (c.total_spent || 0) >= 15000
                  const isVerified = c.is_verified === 1

                  return (
                    <tr key={c.customer_id} className="hover:bg-gray-50/70 transition">
                      {/* Customer Profile Column */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {c.profile_picture ? (
                            <img
                              src={c.profile_picture}
                              alt={name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-300 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center border border-slate-700 shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-black text-sm text-[#071A3D] block truncate">{name}</span>
                            <span className="text-[10px] text-gray-400 font-semibold block">ID #{c.customer_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info Column */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 block truncate flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">email</span>
                            <span>{c.email}</span>
                          </span>
                          <span className="text-gray-500 font-medium block truncate flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">phone</span>
                            <span>{c.phone || c.phone_number || 'No Phone Number'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Orders & Spend Column */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-black text-[#C8102E] text-sm block font-mono">
                            ₱{(c.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 block">
                            {c.total_orders || 0} Total Orders
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-3.5">
                        {isVip ? (
                          <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 border border-amber-400 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="material-icons text-xs text-amber-600">stars</span>
                            <span>VIP Client</span>
                          </span>
                        ) : isVerified ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="material-icons text-xs text-emerald-600">verified</span>
                            <span>Active Diner</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="material-icons text-xs text-gray-400">gpp_maybe</span>
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons Column */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(c)}
                            className="p-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 transition cursor-pointer shadow-2xs"
                            title="View Customer Details & History"
                          >
                            <span className="material-icons text-xs text-blue-600">visibility</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-gray-700 transition cursor-pointer shadow-2xs"
                            title="Edit Customer Profile"
                          >
                            <span className="material-icons text-xs text-[#C8102E]">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.customer_id, name)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 transition cursor-pointer"
                            title="Delete Customer Record"
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
      {filteredCustomers.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="customer profiles"
        />
      )}

      {/* REGISTER NEW CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">person_add</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Register New Customer</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Create a new diner profile in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleAddCustomerSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* Profile Photo Uploader */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Profile Photo</label>
                <div className="flex items-center gap-3">
                  {formPicture ? (
                    <img src={formPicture} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-300 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center border border-gray-300 shrink-0">
                      <span className="material-icons text-xl">person</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-blue-600 font-bold hover:bg-gray-100 transition cursor-pointer inline-flex items-center gap-1">
                      <span className="material-icons text-xs">file_upload</span>
                      <span>Choose File</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste photo URL..."
                      value={formPicture}
                      onChange={(e) => setFormPicture(e.target.value)}
                      className="w-full px-3 py-1 rounded-md bg-white border border-gray-300 mt-1.5 text-[11px] focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="maria.santos@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Phone Number</label>
                <input
                  type="text"
                  placeholder="0917 123 4567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Default Password */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Account Password</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-mono text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-icons text-sm">person_add</span>
                  <span>Register Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">edit</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Edit Customer Profile</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Update details for ID #{selectedCustomer.customer_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleEditCustomerSubmit} className="p-5 space-y-3.5 text-xs font-semibold text-gray-800 bg-gray-50/40">
              {/* Profile Photo Uploader */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Profile Photo</label>
                <div className="flex items-center gap-3">
                  {formPicture ? (
                    <img src={formPicture} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-300 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center border border-gray-300 shrink-0">
                      <span className="material-icons text-xl">person</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-blue-600 font-bold hover:bg-gray-100 transition cursor-pointer inline-flex items-center gap-1">
                      <span className="material-icons text-xs">file_upload</span>
                      <span>Change Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste photo URL..."
                      value={formPicture}
                      onChange={(e) => setFormPicture(e.target.value)}
                      className="w-full px-3 py-1 rounded-md bg-white border border-gray-300 mt-1.5 text-[11px] focus:outline-none focus:border-[#C8102E]"
                    />
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-semibold text-xs focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              {/* Account Verification Select */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-[11px]">Account Verification Status</label>
                <select
                  value={formIsVerified}
                  onChange={(e) => setFormIsVerified(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 font-bold text-xs focus:outline-none focus:border-[#C8102E]"
                >
                  <option value={1}>Verified Customer Account</option>
                  <option value={0}>Unverified Account</option>
                </select>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* VIEW CUSTOMER PROFILE DOSSIER MODAL - CLEAN & SIMPLE */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col text-[#071A3D] my-auto">
            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3.5 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">person</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#071A3D] tracking-tight">Customer Profile Dossier</h3>
                  <p className="text-[10px] text-gray-500 font-medium">Customer ID #{selectedCustomer.customer_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Dossier Body */}
            <div className="p-5 space-y-4 text-xs font-semibold text-gray-800 bg-white">
              {/* Profile Overview Card */}
              <div className="text-center bg-gray-50 p-4 rounded-xl border border-gray-300 space-y-2">
                {selectedCustomer.profile_picture ? (
                  <img
                    src={selectedCustomer.profile_picture}
                    alt="Customer"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 mx-auto shadow-2xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#071A3D] text-white font-black text-xl flex items-center justify-center border-2 border-gray-300 mx-auto shadow-2xs">
                    {(selectedCustomer.name || selectedCustomer.full_name || 'C')[0]}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-black text-[#071A3D] tracking-tight">{selectedCustomer.name || selectedCustomer.full_name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedCustomer.email}</p>
                </div>

                <div>
                  {(selectedCustomer.total_spent || 0) >= 15000 ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-400 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <span className="material-icons text-xs text-amber-600">stars</span>
                      <span>VIP Client</span>
                    </span>
                  ) : selectedCustomer.is_verified ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <span className="material-icons text-xs text-emerald-600">verified</span>
                      <span>Active Customer</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-gray-200 text-gray-700 border border-gray-300 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <span className="material-icons text-xs text-gray-500">gpp_maybe</span>
                      <span>Unverified Account</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-300 text-center">
                <div>
                  <span className="text-[9px] uppercase text-gray-400 font-black block">Total Orders</span>
                  <span className="text-lg font-black text-[#071A3D]">{selectedCustomer.total_orders || 0} Orders</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-gray-400 font-black block">Total Lifetime Spend</span>
                  <span className="text-lg font-black text-[#C8102E] font-mono">
                    ₱{(selectedCustomer.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">Customer ID:</span>
                  <span className="font-mono font-bold text-gray-800">#{selectedCustomer.customer_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">Phone Number:</span>
                  <span className="font-bold text-gray-800">{selectedCustomer.phone || selectedCustomer.phone_number || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">Registration Date:</span>
                  <span className="font-bold text-gray-800">
                    {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full py-2 bg-[#071A3D] hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  Close Profile Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
