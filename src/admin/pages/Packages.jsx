import { useState, useEffect } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import PaginationControls from '../../components/PaginationControls'
import ConfirmationModal from '../components/ConfirmationModal'
import api from '../../services/api'

// High-fidelity Skeleton Card Component matching exact package card dimensions
function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden flex flex-col justify-between h-[520px] animate-pulse">
      <div>
        {/* Photo Header Skeleton */}
        <div className="relative h-44 w-full bg-gray-200">
          <div className="absolute top-2.5 left-2.5 w-24 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute top-2.5 right-2.5 w-20 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute bottom-2.5 left-2.5 flex gap-2">
            <div className="w-16 h-4 bg-gray-300 rounded-md"></div>
            <div className="w-20 h-4 bg-gray-300 rounded-md"></div>
          </div>
        </div>

        {/* Card Content Skeleton */}
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Title & Price Row Skeleton */}
          <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2.5">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-16 h-6 bg-gray-300 rounded"></div>
          </div>

          {/* Description line */}
          <div className="h-9 bg-gray-100 rounded-md border border-gray-200"></div>

          {/* Dish Allowances Box Skeleton */}
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-300 rounded w-2/5"></div>
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 divide-y divide-gray-100 space-y-1">
              <div className="flex justify-between items-center py-0.5">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-red-100 rounded w-12 border border-red-200"></div>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <div className="h-3 bg-gray-200 rounded w-2/5"></div>
                <div className="h-4 bg-red-100 rounded w-12 border border-red-200"></div>
              </div>
            </div>
          </div>

          {/* Included Services Box Skeleton */}
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-300 rounded w-2/5"></div>
            <div className="flex flex-wrap gap-1.5">
              <div className="h-5 bg-emerald-50 rounded-md w-24 border border-emerald-200"></div>
              <div className="h-5 bg-emerald-50 rounded-md w-28 border border-emerald-200"></div>
              <div className="h-5 bg-emerald-50 rounded-md w-20 border border-emerald-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
        <div className="w-28 h-7 bg-gray-200 rounded-md"></div>
        <div className="flex gap-1.5">
          <div className="w-14 h-7 bg-gray-200 rounded-md"></div>
          <div className="w-7 h-7 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  )
}

function Packages(props) {
  const context = useOutletContext() || {}
  const location = useLocation()
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [cateringPackages, setCateringPackages] = useState([])
  const [menuCategories, setMenuCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [packageCurrentPage, setPackageCurrentPage] = useState(1)
  const packageItemsPerPage = 8

  // Helper to resolve food thumbnail images for categories
  const getCategoryImg = (catKey) => {
    const keyStr = String(catKey || '').toLowerCase()
    const matchingItem = menuItems.find(item => {
      const itemCat = String(item.category || item.category_slug || item.category_name || item.category_id || '').toLowerCase()
      return item.image && (itemCat === keyStr || keyStr.includes(itemCat) || itemCat.includes(keyStr))
    })
    if (matchingItem?.image) return matchingItem.image

    if (keyStr.includes('pork') || keyStr.includes('lechon') || keyStr.includes('sisig') || keyStr.includes('bbq')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('chicken') || keyStr.includes('inasal') || keyStr.includes('wings') || keyStr.includes('fried')) {
      return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('beef') || keyStr.includes('steak') || keyStr.includes('caldereta') || keyStr.includes('bulalo')) {
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('seafood') || keyStr.includes('fish') || keyStr.includes('shrimp') || keyStr.includes('tuna') || keyStr.includes('squid')) {
      return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('dessert') || keyStr.includes('cake') || keyStr.includes('sweet') || keyStr.includes('flan') || keyStr.includes('pastr')) {
      return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('drink') || keyStr.includes('beverage') || keyStr.includes('juice') || keyStr.includes('tea')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('sizzler') || keyStr.includes('sizzle') || keyStr.includes('tray') || keyStr.includes('platter')) {
      return 'https://images.unsplash.com/photo-1555244162-803834f70033?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('pasta') || keyStr.includes('noodle') || keyStr.includes('spaghetti') || keyStr.includes('bihon')) {
      return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=150&auto=format&fit=crop&q=80'
    }
    if (keyStr.includes('salad') || keyStr.includes('vegetable') || keyStr.includes('appetizer') || keyStr.includes('soup')) {
      return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=150&auto=format&fit=crop&q=80'
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'
  }

  // Add / Edit Package Modal States
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [packageToDelete, setPackageToDelete] = useState(null)
  const [isDeletingPackage, setIsDeletingPackage] = useState(false)

  const [pkgName, setPkgName] = useState('')
  const [pkgDesc, setPkgDesc] = useState('')
  const [pkgImage, setPkgImage] = useState('')
  const [pkgPrice, setPkgPrice] = useState('15000')
  const [pkgMinGuests, setPkgMinGuests] = useState(30)
  const [pkgMaxGuests, setPkgMaxGuests] = useState(150)
  const [pkgExtraGuestFee, setPkgExtraGuestFee] = useState('')
  const [pkgPrepTime, setPkgPrepTime] = useState('24 Hours Advance Notice')
  const [pkgRecommendedFor, setPkgRecommendedFor] = useState('')

  // Dynamic Category Allowances State: { [category_slug_or_id]: number }
  const [categoryAllowances, setCategoryAllowances] = useState({})

  // Package Curated Specific Dishes State: Array of dish objects
  const [selectedPackageDishes, setSelectedPackageDishes] = useState([])
  const [packageMenuTab, setPackageMenuTab] = useState('allowances') // 'allowances' | 'dishes'
  const [dishSearchQuery, setDishSearchQuery] = useState('')
  const [dishCategoryFilter, setDishCategoryFilter] = useState('all')

  // Dynamic Custom Services / Inclusions List: string[]
  const [customServices, setCustomServices] = useState([])
  const [newServiceInput, setNewServiceInput] = useState('')

  // Default Package Banner Image
  const defaultPackageImage = 'https://images.unsplash.com/photo-1555244162-803834f70033?w=700&auto=format&fit=crop&q=80'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.allSettled([
        fetchCateringPackages(),
        fetchMenuCategories(),
        fetchMenuItems()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const data = await api.menu.getMenuItems()
      if (data.status === 'success' && Array.isArray(data.items)) {
        setMenuItems(data.items)
      }
    } catch (e) {
      console.warn('Could not fetch menu items:', e)
    }
  }

  const fetchMenuCategories = async () => {
    try {
      const data = await api.menu.getCategories()
      if (data.status === 'success' && Array.isArray(data.categories)) {
        setMenuCategories(data.categories)
      }
    } catch (e) {
      console.warn('Could not fetch categories:', e)
    }
  }

  const fetchCateringPackages = async () => {
    try {
      const data = await api.catering.getPackages()
      if (data.status === 'success' && data.packages) {
        setCateringPackages(data.packages)
      }
    } catch (e) {
      showToast('Could not fetch catering packages from database.', 'error')
    }
  }

  const handleOpenAddPackage = () => {
    setEditingPackage(null)
    setPkgName('')
    setPkgDesc('')
    setPkgImage('')
    setPkgPrice('15000')
    setPkgMinGuests(30)
    setPkgMaxGuests(150)
    setPkgExtraGuestFee('')
    setPkgPrepTime('24 Hours Advance Notice')
    setPkgRecommendedFor('')

    // Start with empty dynamic category & dish selections
    setCategoryAllowances({})
    setSelectedPackageDishes([])
    setPackageMenuTab('allowances')
    setDishSearchQuery('')
    setDishCategoryFilter('all')
    setCustomServices([])
    setNewServiceInput('')
    setIsPackageModalOpen(true)
  }

  useEffect(() => {
    if (location.state?.openAddPackage) {
      handleOpenAddPackage()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg)
    setPkgName(pkg.package_name)
    setPkgDesc(pkg.description || '')
    setPkgImage(pkg.package_image || '')
    setPkgPrice(String(pkg.package_price || pkg.price_per_person || 15000))
    setPkgMinGuests(pkg.min_guests || 30)
    setPkgMaxGuests(pkg.max_guests || 150)
    setPkgExtraGuestFee(pkg.extra_guest_fee && Number(pkg.extra_guest_fee) > 0 ? String(pkg.extra_guest_fee) : '')
    setPkgPrepTime(pkg.prep_time || '24 Hours Advance Notice')
    setPkgRecommendedFor(pkg.recommended_for || '')

    let loadedAllowances = {}
    if (pkg.category_allowances && typeof pkg.category_allowances === 'object') {
      Object.entries(pkg.category_allowances).forEach(([k, v]) => {
        if (Number(v) > 0) loadedAllowances[k] = Number(v)
      })
    }
    setCategoryAllowances(loadedAllowances)

    // Load curated specific package dishes
    let loadedDishes = []
    if (Array.isArray(pkg.package_dishes) && pkg.package_dishes.length > 0) {
      loadedDishes = pkg.package_dishes
    }
    setSelectedPackageDishes(loadedDishes)
    setPackageMenuTab('allowances')
    setDishSearchQuery('')
    setDishCategoryFilter('all')

    // Load custom typed services purely from saved package features
    let loadedServices = []
    if (pkg.features && Array.isArray(pkg.features)) {
      loadedServices = pkg.features.filter(f => {
        const isCategoryDish = menuCategories.some(cat => {
          const label = (cat.label || cat.category_name || '').toLowerCase()
          return f.toLowerCase().includes(label) && /^\d+\s+/.test(f)
        })
        return !isCategoryDish
      })
    }

    setCustomServices(loadedServices)
    setNewServiceInput('')
    setIsPackageModalOpen(true)
  }

  const handleTogglePackageDish = (dish) => {
    const dishId = dish.item_id || dish.id || dish.dish_id
    setSelectedPackageDishes(prev => {
      const exists = prev.some(d => (d.item_id || d.id || d.dish_id) === dishId)
      if (exists) {
        return prev.filter(d => (d.item_id || d.id || d.dish_id) !== dishId)
      } else {
        return [...prev, dish]
      }
    })
  }

  const handleToggleCategory = (catKey) => {
    setCategoryAllowances(prev => {
      const copy = { ...prev }
      if (copy[catKey] && copy[catKey] > 0) {
        delete copy[catKey]
      } else {
        copy[catKey] = 1
      }
      return copy
    })
  }

  const handleSetCategoryQty = (catKey, value) => {
    const val = Math.max(1, parseInt(value, 10) || 1)
    setCategoryAllowances(prev => ({
      ...prev,
      [catKey]: val
    }))
  }

  const handleRemoveCategory = (catKey) => {
    setCategoryAllowances(prev => {
      const copy = { ...prev }
      delete copy[catKey]
      return copy
    })
  }

  // Add Custom Service to Package
  const handleAddCustomService = () => {
    const trimmed = newServiceInput.trim()
    if (!trimmed) return
    if (customServices.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('This service is already in the list.', 'info')
      return
    }
    setCustomServices(prev => [...prev, trimmed])
    setNewServiceInput('')
  }

  // Remove Custom Service
  const handleRemoveCustomService = (indexToRemove) => {
    setCustomServices(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleFileUpload = (e, setImageState) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 600
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
          const compressed = canvas.toDataURL('image/jpeg', 0.6)
          setImageState(compressed)
          showToast('Photo uploaded successfully!', 'success')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSavePackageSubmit = async (e) => {
    e.preventDefault()

    const dynamicCategoryFeatures = []
    let totalMainCount = 0
    let totalSideCount = 0
    let totalDessertCount = 0
    let totalBeverageCount = 0

    menuCategories.forEach(cat => {
      const key = cat.id || cat.category_id || cat.label
      const count = categoryAllowances[key] || 0
      if (count > 0) {
        const label = cat.label || cat.category_name || cat.id
        dynamicCategoryFeatures.push(`${count} ${label}`)

        const lower = label.toLowerCase()
        if (lower.includes('side') || lower.includes('veg') || lower.includes('pasta') || lower.includes('salad')) {
          totalSideCount += count
        } else if (lower.includes('dessert')) {
          totalDessertCount += count
        } else if (lower.includes('drink') || lower.includes('beverage')) {
          totalBeverageCount += count
        } else {
          totalMainCount += count
        }
      }
    })

    const rawPrice = Number(pkgPrice) || 0
    const minGuests = Number(pkgMinGuests) || 30
    const payload = {
      package_name: pkgName,
      description: pkgDesc,
      package_image: pkgImage,
      package_price: rawPrice,
      price_per_person: Math.round(rawPrice / minGuests),
      min_guests: minGuests,
      max_guests: Number(pkgMaxGuests) || 150,
      extra_guest_fee: pkgExtraGuestFee !== '' ? parseFloat(pkgExtraGuestFee) : 0,
      prep_time: pkgPrepTime,
      main_dishes_count: totalMainCount || 2,
      side_dishes_count: totalSideCount || 1,
      dessert_count: totalDessertCount || 1,
      beverage_count: totalBeverageCount || 1,
      category_allowances: categoryAllowances,
      package_dishes: selectedPackageDishes,
      has_rice: customServices.some(s => s.toLowerCase().includes('rice')) ? 1 : 0,
      has_buffet_setup: customServices.some(s => s.toLowerCase().includes('buffet')) ? 1 : 0,
      has_table_setup: customServices.some(s => s.toLowerCase().includes('table')) ? 1 : 0,
      has_staff: customServices.some(s => s.toLowerCase().includes('staff') || s.toLowerCase().includes('waiter')) ? 1 : 0,
      has_decorations: customServices.some(s => s.toLowerCase().includes('decor')) ? 1 : 0,
      recommended_for: pkgRecommendedFor,
      features: customServices,
      status: 'Available'
    }

    if (editingPackage) {
      try {
        const data = await api.catering.updatePackage(editingPackage.package_id, payload)
        if (data.status === 'success') {
          showToast(`Updated package "${pkgName}"!`, 'success')
          fetchCateringPackages()
          setIsPackageModalOpen(false)
        } else {
          showToast(data.message || 'Error updating package', 'error')
        }
      } catch (e) {
        showToast(e.message || 'Could not connect to the server.', 'error')
      }
    } else {
      try {
        const data = await api.catering.createPackage(payload)
        if (data.status === 'success') {
          showToast(`Created new package "${pkgName}"!`, 'success')
          fetchCateringPackages()
          setIsPackageModalOpen(false)
        } else {
          showToast(data.message || 'Error creating package', 'error')
        }
      } catch (e) {
        showToast(e.message || 'Could not connect to the server.', 'error')
      }
    }
  }

  const handleTogglePackageStatus = async (pkg) => {
    const nextStatus = pkg.status === 'Available' ? 'Unavailable' : 'Available'
    try {
      const data = await api.catering.updatePackage(pkg.package_id, { status: nextStatus })
      if (data.status === 'success') {
        showToast(`Package "${pkg.package_name}" set to ${nextStatus}`, 'info')
        fetchCateringPackages()
      } else {
        showToast(data.message || 'Error toggling package status', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    }
  }

  const handleDeletePackage = (pkgOrId) => {
    if (typeof pkgOrId === 'object') {
      setPackageToDelete(pkgOrId)
    } else {
      const found = cateringPackages.find(p => p.package_id === pkgOrId)
      setPackageToDelete(found || { package_id: pkgOrId, package_name: 'Package' })
    }
  }

  const handleConfirmDeletePackage = async () => {
    if (!packageToDelete) return
    setIsDeletingPackage(true)
    try {
      const data = await api.catering.deletePackage(packageToDelete.package_id)
      if (data.status === 'success') {
        showToast(`Deleted package "${packageToDelete.package_name}"`, 'success')
        fetchCateringPackages()
        setPackageToDelete(null)
      } else {
        showToast(data.message || 'Error deleting package', 'error')
      }
    } catch (e) {
      showToast(e.message || 'Could not connect to the server.', 'error')
    } finally {
      setIsDeletingPackage(false)
    }
  }

  // Filter packages based on header search
  const filteredPackages = cateringPackages.filter(pkg => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const nameMatch = (pkg.package_name || '').toLowerCase().includes(q)
    const descMatch = (pkg.description || '').toLowerCase().includes(q)
    const recMatch = (pkg.recommended_for || '').toLowerCase().includes(q)
    return nameMatch || descMatch || recMatch
  })

  // Pagination slice
  const packageTotalPages = Math.max(1, Math.ceil(filteredPackages.length / packageItemsPerPage))
  const paginatedPackages = filteredPackages.slice(
    (packageCurrentPage - 1) * packageItemsPerPage,
    packageCurrentPage * packageItemsPerPage
  )

  const includedCategoryKeys = Object.keys(categoryAllowances).filter(k => (categoryAllowances[k] || 0) > 0)

  const filteredMenuItems = menuItems.filter(item => {
    const itemCat = String(item.category || item.category_slug || item.category_name || item.category_id || '').toLowerCase()
    const matchesCat = dishCategoryFilter === 'all' || itemCat === String(dishCategoryFilter).toLowerCase()
    const matchesSearch = !dishSearchQuery ||
      (item.name || '').toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(dishSearchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Catering Package Offers</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Manage event catering packages, guest capacities, category dish allowances, and included services.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddPackage}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 shrink-0 cursor-pointer"
        >
          <span className="material-icons text-base">add_circle</span>
          <span>Add New Package</span>
        </button>
      </header>

      {/* 2. Package Cards Grid / Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(n => (
            <PackageCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-300 p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#C8102E] flex items-center justify-center mx-auto text-3xl">
            <span className="material-icons text-3xl">inventory_2</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#071A3D]">No Catering Packages Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {searchQuery ? `No packages match "${searchQuery}".` : 'Get started by creating your first event catering package.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddPackage}
            className="px-5 py-2.5 bg-[#C8102E] text-white font-black text-xs rounded-lg hover:bg-[#9B0B21] transition active:scale-95"
          >
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedPackages.map((pkg) => {
            const isAvail = pkg.status === 'Available'
            const packagePrice = parseFloat(pkg.package_price || pkg.price_per_person || 0)
            const catAllow = pkg.category_allowances || {}
            const hasCatAllowances = Object.keys(catAllow).length > 0 && Object.values(catAllow).some(v => Number(v) > 0)
            const cardImg = pkg.package_image || defaultPackageImage

            // Extract non-category service inclusions
            const serviceInclusions = (pkg.features || []).filter(f => {
              const isCategoryDish = menuCategories.some(cat => {
                const label = (cat.label || cat.category_name || '').toLowerCase()
                return f.toLowerCase().includes(label) && /^\d+\s+/.test(f)
              })
              return !isCategoryDish
            })

            // Extract category dish items from features if category_allowances is empty
            const dishFeatures = (pkg.features || []).filter(f => {
              return menuCategories.some(cat => {
                const label = (cat.label || cat.category_name || '').toLowerCase()
                return f.toLowerCase().includes(label) && /^\d+\s+/.test(f)
              })
            })

            return (
              <div
                key={pkg.package_id}
                className="group bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden flex flex-col justify-between h-[520px] hover:shadow-md transition-all duration-200 text-[#071A3D]"
              >
                {/* 1. PHOTO HEADER CONTAINER (Fixed top) */}
                <div className="relative h-44 w-full bg-gray-900 overflow-hidden border-b border-gray-300 shrink-0">
                  <img
                    src={cardImg}
                    alt={pkg.package_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Top Left Catering Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md border bg-black/60 text-white/90 border-white/30 flex items-center gap-1">
                    <span className="material-icons text-[11px] text-amber-400">bento</span>
                    <span>PACKAGE TIER</span>
                  </div>

                  {/* Top Right Availability Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePackageStatus(pkg)}
                    className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-[9px] font-black shadow-md backdrop-blur-md border transition-all active:scale-95 cursor-pointer ${isAvail
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
                        : 'bg-red-950/90 text-red-300 border-red-500/60 hover:bg-red-900'
                      }`}
                    title="Click to toggle package availability"
                  >
                    {isAvail ? '● AVAILABLE' : '○ UNAVAILABLE'}
                  </button>

                  {/* Bottom Left Image Overlay: Advance Order Notice & Capacity */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold text-white bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/20 flex items-center gap-1" title="Kitchen Advance Preparation Notice">
                      <span className="material-icons text-xs text-amber-400">notifications_active</span>
                      <span>{pkg.prep_time || '24h Notice'}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-white bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/20 flex items-center gap-1">
                      <span className="material-icons text-xs text-blue-400">groups</span>
                      <span>{pkg.min_guests || 30}–{pkg.max_guests || 150} Pax</span>
                    </span>
                  </div>
                </div>

                {/* 2. CARD CONTENT BODY (Scrollable inside) */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 overflow-y-auto min-h-0">

                  {/* Title & Price Header Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-[#071A3D] group-hover:text-[#C8102E] transition-colors truncate tracking-tight uppercase">
                        {pkg.package_name}
                      </h3>
                      {pkg.recommended_for ? (
                        <p className="text-[11px] text-gray-500 line-clamp-1 leading-snug font-medium mt-0.5" title={pkg.recommended_for}>
                          {pkg.recommended_for}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic line-clamp-1 leading-snug mt-0.5">
                          No recommended events set
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#C8102E] tracking-tight block font-mono">
                        ₱{packagePrice.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Package</span>
                      {pkg.extra_guest_fee && Number(pkg.extra_guest_fee) > 0 ? (
                        <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          +₱{parseFloat(pkg.extra_guest_fee).toLocaleString()}/excess pax
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-semibold text-gray-400 dark:text-gray-500 block mt-0.5">
                          No extra guest fee
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description / Placeholder */}
                  {pkg.description ? (
                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed italic bg-gray-50 p-2 rounded-md border border-gray-200">
                      "{pkg.description}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic bg-gray-50/60 p-2 rounded-md border border-dashed border-gray-200 text-center">
                      No overview description provided.
                    </p>
                  )}

                  {/* Dish Selection Allowances Section with Refined Layout */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                      <span className="material-icons text-xs text-[#C8102E]">restaurant_menu</span>
                      <span>Dish Selection Allowances</span>
                    </span>

                    {hasCatAllowances || dishFeatures.length > 0 ? (
                      <div className="bg-gray-50/90 rounded-lg p-2 border border-gray-200 divide-y divide-gray-200/60 text-xs shadow-2xs">
                        {hasCatAllowances ? (
                          Object.entries(catAllow).map(([catKey, count]) => {
                            if (Number(count) <= 0) return null
                            const foundCat = menuCategories.find(c => (c.id === catKey || c.category_id === Number(catKey) || c.label === catKey))
                            const catName = foundCat?.label || foundCat?.category_name || catKey.replace(/_/g, ' ')
                            return (
                              <div key={catKey} className="flex items-center justify-between py-1 first:pt-0 last:pb-0 text-gray-700 font-bold capitalize">
                                <span className="flex items-center gap-1.5 truncate mr-2">
                                  <img
                                    src={getCategoryImg(catKey)}
                                    alt={catName}
                                    className="w-4 h-4 rounded-full object-cover shrink-0 border border-gray-300"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                  />
                                  <span className="truncate">{catName}</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-[#C8102E] font-extrabold text-[10px] font-mono border border-red-200/80 shrink-0">
                                  {count} {Number(count) > 1 ? 'choices' : 'choice'}
                                </span>
                              </div>
                            )
                          })
                        ) : (
                          dishFeatures.map((df, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1 first:pt-0 last:pb-0 text-gray-700 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="text-emerald-600 font-black text-xs shrink-0">✓</span>
                                <span>{df}</span>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50/70 rounded-lg p-2 border border-dashed border-gray-300 text-center text-[10px] text-gray-400 italic">
                        No dish category allowances configured.
                      </div>
                    )}
                  </div>

                  {/* Curated Package Dishes Display */}
                  {Array.isArray(pkg.package_dishes) && pkg.package_dishes.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-xs text-amber-600">lunch_dining</span>
                          <span>Curated Menu Items</span>
                        </span>
                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                          {pkg.package_dishes.length} {pkg.package_dishes.length === 1 ? 'item' : 'items'}
                        </span>
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {pkg.package_dishes.map((dish, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-950 border border-amber-200 text-[10px] font-bold truncate max-w-full shadow-2xs"
                            title={dish.name || dish.dish_name}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="truncate">{dish.name || dish.dish_name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Included Services & Setup Section with Sleek Tag Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                      <span className="material-icons text-xs text-emerald-600">verified</span>
                      <span>Included Services & Setup</span>
                    </span>

                    {serviceInclusions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {serviceInclusions.map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50/90 text-emerald-950 border border-emerald-300 text-[10.5px] font-bold shadow-2xs"
                          >
                            <span className="text-emerald-600 font-black text-[10px] shrink-0">✓</span>
                            <span>{service}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50/70 rounded-lg p-2 border border-dashed border-gray-300 text-center text-[10px] text-gray-400 italic">
                        No additional setup services listed.
                      </div>
                    )}
                  </div>

                </div>

                {/* 3. CARD ACTION FOOTER (Fixed bottom) */}
                <div className="p-2.5 bg-gray-50/80 border-t border-gray-400 flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePackageStatus(pkg)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs ${isAvail ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                      }`}
                  >
                    {isAvail ? 'Set Unavailable' : 'Set Available'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPackage(pkg)}
                      className="px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                    >
                      <span className="material-icons text-xs text-[#C8102E]">edit</span>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.package_id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 cursor-pointer transition active:scale-95"
                      title="Delete Package"
                    >
                      <span className="material-icons text-xs">delete</span>
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!isLoading && filteredPackages.length > 0 && (
        <PaginationControls
          currentPage={packageCurrentPage}
          totalPages={packageTotalPages}
          totalItems={filteredPackages.length}
          itemsPerPage={packageItemsPerPage}
          onPageChange={(page) => setPackageCurrentPage(page)}
          itemLabel="catering packages"
        />
      )}

      {/* ADD / EDIT PACKAGE MODAL (Identical layout to MenuManagement AddDishModal) */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto text-[#071A3D]">

            {/* Modal Header */}
            <header className="bg-white border-b border-gray-300 p-3 sm:p-3.5 px-3.5 sm:px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
                  <span className="material-icons text-base">
                    {editingPackage ? 'edit' : 'inventory_2'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-black text-[#071A3D] tracking-tight truncate">
                    {editingPackage ? 'Edit Catering Package' : 'Add New Catering Package'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium truncate">
                    Configure package rates, guest capacity, category dish allowances, and custom included services
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
              >
                <span className="material-icons text-base">close</span>
              </button>
            </header>

            {/* Modal Form */}
            <form onSubmit={handleSavePackageSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/50">

              {/* SECTION 1: TOP ROW (General Info & Media VS Pricing & Capacity) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                {/* CARD 1: PACKAGE GENERAL INFO & MEDIA (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                      <span className="material-icons text-xs text-[#C8102E]">inventory_2</span>
                      <span>Package Overview & Media</span>
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">Core Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Classic Banquet Package"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1 text-[11px]">Recommended For</label>
                      <input
                        type="text"
                        placeholder="e.g., Birthdays & family events"
                        value={pkgRecommendedFor}
                        onChange={(e) => setPkgRecommendedFor(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Description</label>
                    <textarea
                      rows="2"
                      placeholder="Short description of what makes this catering tier special..."
                      value={pkgDesc}
                      onChange={(e) => setPkgDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-medium text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Compact Image Upload & URL */}
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[11px]">Package Banner Image</label>
                    <div className="flex gap-3 items-center">
                      {pkgImage ? (
                        <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-900 shrink-0 relative group">
                          <img src={pkgImage} alt="Package Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPkgImage('')}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs cursor-pointer"
                            title="Remove Image"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center shrink-0 text-gray-400">
                          <span className="material-icons text-base text-gray-400">image</span>
                          <span className="text-[9px] font-bold">No Image</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition shrink-0">
                            <span className="material-icons text-xs text-[#C8102E]">file_upload</span>
                            <span>{pkgImage ? 'Change Photo' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, setPkgImage)}
                              className="hidden"
                            />
                          </label>
                          {pkgImage && (
                            <button
                              type="button"
                              onClick={() => setPkgImage('')}
                              className="text-red-600 hover:underline font-bold text-[10px] cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Or paste image URL (https://...)"
                          value={pkgImage}
                          onChange={(e) => setPkgImage(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-md bg-gray-50 border border-gray-300 font-medium text-[10px] text-gray-800 focus:outline-none focus:border-[#C8102E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PRICING & CAPACITY STRUCTURE (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                      <span className="material-icons text-xs text-[#C8102E]">payments</span>
                      <span>Pricing & Guest Capacity</span>
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">Rates & Limits</span>
                  </div>

                  {/* Pricing Inputs Grid (Side-by-Side) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                        Base Package Price (₱) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500 text-xs">₱</span>
                        <input
                          type="number"
                          required
                          min="1"
                          step="any"
                          placeholder="15000"
                          value={pkgPrice}
                          onChange={(e) => setPkgPrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-black text-xs text-[#C8102E] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                        />
                      </div>
                      <span className="text-[9.5px] text-gray-400 mt-0.5 block">Flat base package price</span>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1 text-[11px]">
                        Fee Per Extra Guest (₱ / Person)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500 text-xs">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="None (leave blank if no extra fee)"
                          value={pkgExtraGuestFee}
                          onChange={(e) => setPkgExtraGuestFee(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-300 font-bold text-xs text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                        />
                      </div>
                      <span className="text-[9.5px] text-gray-400 mt-0.5 block">For guests exceeding max capacity</span>
                    </div>
                  </div>

                  {/* Capacity & Advance Notice Configuration */}
                  <div className="space-y-3">
                    {/* Capacity Grid (2 Columns) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-gray-700 font-bold mb-1 text-[10px]">Min Guests *</label>
                        <input
                          type="number"
                          required
                          min="5"
                          value={pkgMinGuests}
                          onChange={(e) => setPkgMinGuests(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-1 text-[10px]">Max Included *</label>
                        <input
                          type="number"
                          required
                          min="5"
                          value={pkgMaxGuests}
                          onChange={(e) => setPkgMaxGuests(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition text-center"
                        />
                      </div>
                    </div>

                    {/* Advance Notice Field */}
                    <div>
                      <label className="block text-gray-700 font-bold mb-1 text-[10px] flex items-center justify-between">
                        <span>Advance Order Notice (Kitchen Lead Time)</span>
                        <span className="text-[9px] text-gray-400 font-normal">e.g. 24 Hours, 2 Days</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xs">notifications_active</span>
                        <input
                          type="text"
                          placeholder="e.g. 24 Hours Advance Notice"
                          value={pkgPrepTime}
                          onChange={(e) => setPkgPrepTime(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 font-semibold text-xs text-gray-800 focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">
                        Advance booking notice required for kitchen prep (not dining event duration).
                      </span>
                    </div>
                  </div>

                  {/* Live Capacity & Pricing Snapshot Pill */}
                  <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <span className="material-icons text-xs text-amber-700">info</span>
                      <span>Included: {pkgMinGuests || 20}–{pkgMaxGuests || 50} Guests</span>
                    </div>
                    <span className="font-extrabold text-[#C8102E] font-mono">
                      ₱{Number(pkgPrice || 0).toLocaleString()}
                      {pkgExtraGuestFee && Number(pkgExtraGuestFee) > 0 ? ` (+₱${Number(pkgExtraGuestFee).toLocaleString()}/extra pax)` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BOTTOM ROW (Dish Allowances & Custom Included Services) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                {/* CARD 3: PACKAGE MENU & DISH ALLOWANCES (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-gray-300 shadow-xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold">
                        <span className="material-icons text-base">restaurant_menu</span>
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#071A3D] uppercase tracking-wide">
                          Package Menu Configuration
                        </h4>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Set category dish allowances or curate specific included menu dishes
                        </p>
                      </div>
                    </div>

                    {/* Sub-Tabs Switcher */}
                    <div className="flex items-center p-0.5 rounded-lg bg-gray-100 border border-gray-200 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setPackageMenuTab('allowances')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${packageMenuTab === 'allowances'
                            ? 'bg-white text-[#C8102E] shadow-2xs font-black'
                            : 'text-gray-500 hover:text-gray-800'
                          }`}
                      >
                        <span className="material-icons text-xs">tune</span>
                        <span>Category Allowances</span>
                        {includedCategoryKeys.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-[#C8102E] rounded-full text-[9px] font-black">
                            {includedCategoryKeys.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPackageMenuTab('dishes')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${packageMenuTab === 'dishes'
                            ? 'bg-white text-[#C8102E] shadow-2xs font-black'
                            : 'text-gray-500 hover:text-gray-800'
                          }`}
                      >
                        <span className="material-icons text-xs">lunch_dining</span>
                        <span>Curate Dishes</span>
                        {selectedPackageDishes.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black">
                            {selectedPackageDishes.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: CATEGORY DISH ALLOWANCES */}
                  {packageMenuTab === 'allowances' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      {/* Category Toggle Chips */}
                      <div className="space-y-2">
                        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                          Included Food Categories (Click to toggle):
                        </span>
                        {menuCategories.length === 0 ? (
                          <div className="text-xs text-gray-400 italic py-1">
                            No menu categories available. Please configure categories in Menu Management.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {menuCategories.map((cat) => {
                              const key = cat.id || cat.category_id || cat.label
                              const label = cat.label || cat.category_name || cat.id
                              const isIncluded = (categoryAllowances[key] || 0) > 0

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => handleToggleCategory(key)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${isIncluded
                                      ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 font-extrabold shadow-xs'
                                      : 'bg-white text-slate-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                  <img
                                    src={getCategoryImg(key)}
                                    alt={label}
                                    className="w-4 h-4 rounded-full object-cover shrink-0 border border-gray-300 shadow-2xs"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                  />
                                  <span>{label}</span>
                                  <span className={`text-xs font-black ${isIncluded ? 'text-emerald-700' : 'text-gray-400'}`}>
                                    {isIncluded ? '✓' : '+'}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Selected Categories Quantities Grid */}
                      {includedCategoryKeys.length === 0 ? (
                        <div className="py-4 px-4 text-center text-gray-400 text-xs italic font-medium bg-[#FAFAFA] rounded-xl border border-dashed border-gray-300">
                          No categories selected. Click the category badges above to include dish allowances.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {includedCategoryKeys.map((catKey) => {
                            const foundCat = menuCategories.find(c => (c.id === catKey || c.category_id === Number(catKey) || c.label === catKey))
                            const label = foundCat?.label || foundCat?.category_name || catKey.replace(/_/g, ' ')
                            const currentQty = categoryAllowances[catKey] || 1

                            return (
                              <div key={catKey} className="p-2 rounded-xl bg-gray-50 border border-gray-300 flex items-center justify-between gap-2 shadow-2xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={getCategoryImg(catKey)}
                                    alt={label}
                                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-300 shadow-2xs"
                                    onError={(e) => { e.target.style.display = 'none' }}
                                  />
                                  <div className="min-w-0">
                                    <label className="block text-[#071A3D] font-bold text-xs truncate capitalize leading-tight" title={label}>
                                      {label}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCategory(catKey)}
                                      className="text-gray-400 hover:text-red-600 text-[10px] font-semibold transition cursor-pointer leading-none mt-0.5 block"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={currentQty}
                                    onChange={(e) => handleSetCategoryQty(catKey, e.target.value)}
                                    className="w-11 py-1 px-1 rounded-lg border border-gray-300 font-extrabold text-xs text-center bg-white text-[#071A3D] shadow-2xs focus:outline-none focus:border-[#C8102E]"
                                  />
                                  <span className="text-[9.5px] text-gray-400 font-bold">qty</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: CURATE SPECIFIC DISHES */}
                  {packageMenuTab === 'dishes' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      {/* Search & Category Filter */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            search
                          </span>
                          <input
                            type="text"
                            placeholder="Search dishes by name or keywords..."
                            value={dishSearchQuery}
                            onChange={(e) => setDishSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-semibold text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                          />
                          {dishSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setDishSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <select
                          value={dishCategoryFilter}
                          onChange={(e) => setDishCategoryFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-300 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#C8102E] cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          {menuCategories.map((c) => {
                            const val = c.id || c.category_id || c.label
                            const lbl = c.label || c.category_name || val
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      {/* Selected Dishes Tray */}
                      <div className="space-y-1 bg-gray-50/80 p-2.5 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                            <span className="material-icons text-xs text-emerald-600">check_circle</span>
                            <span>Included in Package ({selectedPackageDishes.length} dishes):</span>
                          </span>
                          {selectedPackageDishes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedPackageDishes([])}
                              className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {selectedPackageDishes.length === 0 ? (
                          <p className="text-[11px] text-gray-400 italic py-1">
                            No specific dishes added yet. Click dishes below to include them in this package.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                            {selectedPackageDishes.map((dish) => {
                              const dishId = dish.item_id || dish.id || dish.dish_id
                              return (
                                <div
                                  key={dishId}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-[11px] font-bold shadow-2xs"
                                >
                                  {dish.image && (
                                    <img
                                      src={dish.image}
                                      alt={dish.name}
                                      className="w-4 h-4 rounded-full object-cover shrink-0 border border-emerald-200"
                                      onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                  )}
                                  <span className="truncate max-w-[130px]">{dish.name || dish.dish_name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePackageDish(dish)}
                                    className="text-gray-400 hover:text-red-600 font-black ml-0.5 cursor-pointer text-xs"
                                    title="Remove dish"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Dishes Catalog Grid */}
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                          Available Menu Catalog ({filteredMenuItems.length}):
                        </span>

                        {filteredMenuItems.length === 0 ? (
                          <div className="py-4 text-center text-gray-400 text-xs italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No menu items found matching "{dishSearchQuery}".
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                            {filteredMenuItems.map((item) => {
                              const itemId = item.item_id || item.id
                              const isSelected = selectedPackageDishes.some(d => (d.item_id || d.id || d.dish_id) === itemId)

                              return (
                                <div
                                  key={itemId}
                                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${isSelected
                                      ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                                      : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <img
                                      src={item.image || getCategoryImg(item.category)}
                                      alt={item.name}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200 shadow-2xs"
                                      onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-extrabold text-xs text-[#071A3D] truncate leading-tight">
                                        {item.name}
                                      </h5>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 capitalize truncate">
                                          {item.category || 'General'}
                                        </span>
                                        <span className="text-[10px] font-black text-[#C8102E]">
                                          ₱{parseFloat(item.price || 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePackageDish(item)}
                                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer shrink-0 active:scale-95 shadow-2xs ${isSelected
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-gray-100 hover:bg-[#C8102E] text-gray-700 hover:text-white border border-gray-200'
                                      }`}
                                  >
                                    {isSelected ? '✓ Included' : '+ Add'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 4: INCLUDED SERVICES & SETUP (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-gray-300 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-[11px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                      <span className="material-icons text-xs text-[#C8102E]">check_circle</span>
                      <span>Included Services & Setup</span>
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Custom Inclusions
                    </span>
                  </div>

                  {/* Input Field with Add Button */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Buffet Table, Waiters..."
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomService()
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-xs font-semibold text-[#071A3D] focus:outline-none focus:border-[#C8102E] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomService}
                      className="px-3.5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <span className="material-icons text-xs">add</span>
                      <span>Add</span>
                    </button>
                  </div>

                  {/* List of Added Services */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block">
                      Current Inclusions ({customServices.length}):
                    </span>

                    {customServices.length === 0 ? (
                      <div className="py-3 px-3 text-center text-gray-400 text-[11px] italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No custom services added yet.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-0.5">
                        {customServices.map((service, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 text-[11px] font-bold shadow-2xs"
                          >
                            <span className="text-emerald-600 font-black text-xs">✓</span>
                            <span>{service}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomService(index)}
                              className="text-emerald-700 hover:text-red-600 ml-0.5 font-black text-xs transition cursor-pointer"
                              title="Remove inclusion"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  {editingPackage ? 'Save Changes' : 'Create Package'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!packageToDelete}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleConfirmDeletePackage}
        title={`Delete "${packageToDelete?.package_name}"?`}
        message="Are you sure you want to permanently delete this catering package? This action cannot be undone."
        confirmText="Yes, Delete Package"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingPackage}
      />

    </div>
  )
}

export default Packages
