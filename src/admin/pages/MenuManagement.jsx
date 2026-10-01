import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'
import ViewDishModal from '../components/ViewDishModal'
import PaginationControls from '../../components/PaginationControls'
import MenuFilterBar from '../components/MenuFilterBar'
import AddDishModal from '../components/AddDishModal'
import EditDishModal from '../components/EditDishModal'
import CategoryManagementModal from '../components/CategoryManagementModal'
import ConfirmationModal from '../components/ConfirmationModal'
import PackageModal from '../components/PackageModal'
import api from '../../services/api'


// High-fidelity Skeleton Component matching dish card dimensions
function DishCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-xs overflow-hidden flex flex-col justify-between animate-pulse text-[#071A3D]">
      <div>
        {/* 1. DISH PHOTO CONTAINER SKELETON */}
        <div className="relative h-44 w-full bg-gray-200">
          <div className="absolute top-2.5 left-2.5 w-20 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute top-2.5 right-2.5 w-24 h-5 bg-gray-300 rounded-md"></div>
          <div className="absolute bottom-2.5 left-2.5 w-16 h-4 bg-gray-300 rounded-md"></div>
        </div>

        {/* 2. CARD CONTENT BODY SKELETON */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="w-14 h-6 bg-gray-300 rounded shrink-0"></div>
          </div>

          <div className="space-y-1.5">
            <div className="h-6 bg-gray-100 rounded-md border border-gray-200"></div>
            <div className="h-6 bg-emerald-50/50 rounded-md border border-emerald-200/60"></div>
          </div>
        </div>
      </div>

      {/* 3. CARD ACTION FOOTER SKELETON */}
      <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 mt-3">
        <div className="w-16 h-7 bg-gray-200 rounded-md"></div>
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-7 bg-gray-200 rounded-md"></div>
          <div className="w-7 h-7 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  )
}

function MenuManagement(props) {
  const context = useOutletContext() || {}
  const navigate = useNavigate()
  const searchQuery = props.searchQuery || context.searchQuery || ''
  const { showToast } = useToast()

  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Dishes' }
  ])

  const [menuFilter, setMenuFilter] = useState('all')
  const [menuSearchQuery, setMenuSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const categoryScrollRef = useRef(null)

  // Modal States
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false)
  const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false)
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false)
  const [selectedDishDetail, setSelectedDishDetail] = useState(null)
  const [editingDish, setEditingDish] = useState(null)

  // Add Dish Form Fields
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formServingSize, setFormServingSize] = useState('')
  const [formPrepTime, setFormPrepTime] = useState('')
  const [formAvailability, setFormAvailability] = useState('Available')
  const [formImage, setFormImage] = useState('')
  const [formIngredients, setFormIngredients] = useState('')
  const [formAllergens, setFormAllergens] = useState('')
  const [formStatus, setFormStatus] = useState('Active')
  const [formIsFeatured, setFormIsFeatured] = useState(false)

  // Edit Dish Form Fields
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editServingSize, setEditServingSize] = useState('')
  const [editPrepTime, setEditPrepTime] = useState('')
  const [editAvailability, setEditAvailability] = useState('Available')
  const [editImage, setEditImage] = useState('')
  const [editIngredients, setEditIngredients] = useState('')
  const [editAllergens, setEditAllergens] = useState('')
  const [editStatus, setEditStatus] = useState('Active')
  const [editIsFeatured, setEditIsFeatured] = useState(false)

  // Category Edit / Add States
  const [editingCatId, setEditingCatId] = useState(null)
  const [editingCatLabel, setEditingCatLabel] = useState('')
  const [editingCatDescription, setEditingCatDescription] = useState('')
  const [editingCatStatus, setEditingCatStatus] = useState('Active')
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatDescription, setNewCatDescription] = useState('')
  const [newCatStatus, setNewCatStatus] = useState('Active')

  // Confirm Modal Config
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Yes, Delete',
    onConfirm: null
  })

  const openConfirmModal = ({ title, message, confirmText = 'Yes, Delete', onConfirm }) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm: () => {
        onConfirm()
        setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.allSettled([
        fetchMenuItems(),
        fetchCategories()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Synchronize category selection defaults when categories load
  useEffect(() => {
    if (categories.length > 1) {
      const validFirstCat = categories.find(c => c.id !== 'all')?.id || ''
      if (!formCategory || !categories.some(c => c.id === formCategory)) {
        setFormCategory(validFirstCat)
      }
      if (!editCategory || !categories.some(c => c.id === editCategory)) {
        setEditCategory(validFirstCat)
      }
    }
  }, [categories])

  const fetchMenuItems = async () => {
    try {
      const data = await api.menu.getMenuItems()
      if (data.status === 'success' && data.items) {
        setMenuItems(data.items.map(item => ({
          ...item,
          price: parseFloat(item.price || 0),
          is_featured: Boolean(item.is_featured),
        })))
      } else {
        showToast(data.message || 'Could not fetch menu items.', 'error')
      }
    } catch (e) {
      showToast('Could not fetch menu items from database.', 'error')
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await api.menu.getCategories()
      if (data.status === 'success' && Array.isArray(data.categories)) {
        setCategories([
          { id: 'all', category_id: 0, label: 'All Dishes', category_name: 'All Dishes', description: 'Complete diner food catalog', status: 'Active' },
          ...data.categories.map(c => ({
            category_id: c.category_id || c.id,
            category_slug: c.id || c.category_slug || String(c.category_id),
            id: c.id || c.category_slug || String(c.category_id),
            label: c.label || c.category_name || String(c.category_id),
            category_name: c.label || c.category_name || String(c.category_id),
            description: c.description || '',
            status: c.status || 'Active'
          }))
        ])
      }
    } catch (e) {
      showToast('Could not fetch menu categories.', 'error')
    }
  }

  const handleFileUpload = (e, setImageState) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Resize high-res image to max 800px for super-fast web loading & small DB payload
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const MAX_SIZE = 800

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setImageState(compressedDataUrl)
          showToast(`Optimized & loaded "${file.name}"`, 'success')
        }
        img.onerror = () => {
          setImageState(event.target.result)
          showToast(`Loaded "${file.name}"`, 'info')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleToggleStock = async (dishId) => {
    const dish = menuItems.find(i => i.id === dishId)
    if (!dish) return
    const nextState = dish.availability === 'Available' ? 'Unavailable' : 'Available'

    // Optimistic UI update
    setMenuItems(prev => prev.map(item => {
      if (item.id === dishId) {
        return { ...item, availability: nextState }
      }
      return item
    }))

    try {
      const data = await api.menu.updateAvailability(dishId, nextState)
      if (data.status === 'success') {
        showToast(`"${dish.name}" set to ${nextState.toUpperCase()}`, 'info')
      } else {
        throw new Error(data.message || 'Failed to update availability')
      }
    } catch (e) {
      fetchMenuItems() // Revert to database state on failure
      showToast('Failed to update dish availability.', 'error')
    }
  }

  const handleToggleFeatured = async (dishId) => {
    const dish = menuItems.find(i => i.id === dishId)
    if (!dish) return
    const nextFeatured = !dish.is_featured

    // Optimistic UI update
    setMenuItems(prev => prev.map(item => {
      if (item.id === dishId) {
        return { ...item, is_featured: nextFeatured }
      }
      return item
    }))

    try {
      const data = await api.menu.toggleFeatured(dishId, nextFeatured)
      if (data.status === 'success') {
        if (nextFeatured) {
          showToast(`"★ ${dish.name}" marked as Featured Dish!`, 'success')
        } else {
          showToast(`Removed "${dish.name}" from Featured Dishes.`, 'info')
        }
      } else {
        throw new Error(data.message || 'Failed to update featured status')
      }
    } catch (e) {
      fetchMenuItems() // Revert to database state on failure
      showToast('Failed to update featured status.', 'error')
    }
  }

  const handleDeleteDish = (dishId, dishName) => {
    openConfirmModal({
      title: 'Delete Dish Item',
      message: `Are you sure you want to delete "${dishName}" from the food menu? This action cannot be undone.`,
      confirmText: 'Delete Dish',
      onConfirm: async () => {
        try {
          const data = await api.menu.deleteMenuItem(dishId)
          if (data.status === 'success') {
            showToast(`Deleted dish item "${dishName}"`, 'info')
            fetchMenuItems()
            if (selectedDishDetail && selectedDishDetail.id === dishId) setSelectedDishDetail(null)
            if (editingDish && editingDish.id === dishId) {
              setIsEditDishModalOpen(false)
              setEditingDish(null)
            }
          } else {
            showToast(data.message || 'Failed to delete dish item.', 'error')
          }
        } catch (e) {
          showToast('Could not connect to server to delete dish.', 'error')
        }
      }
    })
  }

  const handleOpenEditModal = (dish) => {
    if (!dish) return
    const defaultCat = categories.find(c => c.id !== 'all')?.id || ''
    setEditingDish(dish)
    setEditName(dish.name || '')
    setEditCategory(dish.category || defaultCat)
    setEditDescription(dish.description || '')
    setEditPrice(dish.price ?? '')
    setEditServingSize(dish.serving_size || '')
    setEditPrepTime(dish.prep_time || '')
    setEditAvailability(dish.availability || 'Available')
    setEditImage(dish.image || '')
    setEditIngredients(dish.ingredients || '')
    setEditAllergens(dish.allergens || '')
    setEditStatus(dish.status || 'Active')
    setEditIsFeatured(Boolean(dish.is_featured))
    setIsEditDishModalOpen(true)
  }

  const handleEditDishSubmit = async (e) => {
    e.preventDefault()
    if (!editingDish) return

    const updatedDishData = {
      name: editName,
      category: editCategory,
      description: editDescription,
      price: parseFloat(editPrice),
      serving_size: editServingSize,
      prep_time: editPrepTime,
      availability: editAvailability,
      image: editImage || editingDish.image,
      ingredients: editIngredients,
      allergens: editAllergens,
      status: editStatus,
      is_featured: editIsFeatured,
    }

    try {
      const data = await api.menu.updateMenuItem(editingDish.id, updatedDishData)
      if (data.status === 'success') {
        showToast(`Successfully updated "${editName}" specifications!`, 'success')
        fetchMenuItems()
        setIsEditDishModalOpen(false)
        setEditingDish(null)
      } else {
        showToast(data.message || 'Error updating dish specifications.', 'error')
      }
    } catch (err) {
      showToast('Could not connect to the server. Please make sure the Node backend is running.', 'error')
    }
  }

  const handleAddDishSubmit = async (e) => {
    e.preventDefault()
    if (!formName || !formName.trim()) {
      showToast('Please enter a dish name.', 'warning')
      return
    }

    const validCat = formCategory || (categories.find(c => c.id !== 'all')?.id || 'main_course')

    const newItemData = {
      name: formName.trim(),
      category: validCat,
      description: formDescription || 'Signature chef preparation.',
      price: parseFloat(formPrice) || 0,
      serving_size: formServingSize || '1 Serving',
      prep_time: formPrepTime || '25 minutes',
      availability: formAvailability || 'Available',
      image: formImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      ingredients: formIngredients || 'Fresh local ingredients',
      allergens: formAllergens || 'None',
      status: formStatus || 'Active',
      is_featured: formIsFeatured,
    }

    try {
      const data = await api.menu.addMenuItem(newItemData)
      if (data.status === 'success') {
        showToast(data.message || `Added new dish item "${newItemData.name}"!`, 'success')
        fetchMenuItems()
        setIsAddDishModalOpen(false)
        resetDishForm()
      } else {
        showToast(data.message || 'Error adding dish item.', 'error')
      }
    } catch (err) {
      showToast('Could not connect to the server. Please make sure the Node backend is running.', 'error')
    }
  }

  const resetDishForm = () => {
    setFormName('')
    setFormDescription('')
    setFormPrice('')
    setFormServingSize('')
    setFormPrepTime('')
    setFormImage('')
    setFormIngredients('')
    setFormAllergens('')
    setFormIsFeatured(false)
  }

  const handleSaveEditCategory = async (catId) => {
    if (!editingCatLabel || !editingCatLabel.trim()) return

    const cleanLabel = editingCatLabel.trim()
    const cleanDesc = editingCatDescription.trim()
    const cleanStat = editingCatStatus || 'Active'

    try {
      const data = await api.menu.updateCategory(catId, {
        label: cleanLabel,
        description: cleanDesc,
        status: cleanStat
      })
      if (data.status === 'success') {
        showToast(`Updated category "${cleanLabel}" specifications!`, 'success')
        fetchCategories()
        setEditingCatId(null)
      } else {
        showToast(data.message || 'Error updating category', 'error')
      }
    } catch (e) {
      showToast('Could not connect to server.', 'error')
    }
  }

  const handleDeleteCategory = (catId, catLabel) => {
    if (catId === 'all') {
      showToast('Cannot delete "All Dishes" system filter.', 'warning')
      return
    }

    openConfirmModal({
      title: 'Delete Food Category',
      message: `Are you sure you want to delete the category "${catLabel}"? This action cannot be undone.`,
      confirmText: 'Delete Category',
      onConfirm: async () => {
        try {
          const data = await api.menu.deleteCategory(catId)
          if (data.status === 'success') {
            showToast(`Deleted category "${catLabel}"`, 'info')
            fetchCategories()
            if (menuFilter === catId) setMenuFilter('all')
          } else {
            showToast(data.message || 'Error deleting category', 'error')
          }
        } catch (e) {
          showToast('Could not connect to server.', 'error')
        }
      }
    })
  }

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault()
    if (!newCatLabel || !newCatLabel.trim()) {
      showToast('Please enter a category title.', 'warning')
      return
    }

    const cleanLabel = newCatLabel.trim()
    const cleanDesc = newCatDescription.trim()
    const cleanStat = newCatStatus || 'Active'

    try {
      const data = await api.menu.addCategory({
        label: cleanLabel,
        description: cleanDesc,
        status: cleanStat
      })
      if (data.status === 'success') {
        showToast(data.message || `Created new category "${cleanLabel}"!`, 'success')
        await fetchCategories()
        const createdCatId = data.category?.id || data.category?.category_slug || data.category?.category_id || cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')
        setMenuFilter(createdCatId)
        setCurrentPage(1)
        setNewCatLabel('')
        setNewCatDescription('')
        setNewCatStatus('Active')
      } else {
        showToast(data.message || 'Error creating category.', 'error')
      }
    } catch (err) {
      showToast('Could not connect to the server. Please make sure the Node backend is running.', 'error')
    }
  }

  const handleCategoryWheelScroll = (e) => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft += e.deltaY * 0.8
    }
  }

  const handleSelectCategoryFilter = (catId) => {
    setMenuFilter(catId)
    setCurrentPage(1)
  }

  const handleSearchInputChange = (e) => {
    setMenuSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const activeSearch = (menuSearchQuery || searchQuery || '').toLowerCase().trim()

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = !activeSearch ||
      (item.name || '').toLowerCase().includes(activeSearch) ||
      (item.serving_size || '').toLowerCase().includes(activeSearch) ||
      (item.ingredients || '').toLowerCase().includes(activeSearch) ||
      (item.description || '').toLowerCase().includes(activeSearch)
    if (menuFilter === 'all') return matchesSearch
    if (menuFilter === 'featured') return matchesSearch && Boolean(item.is_featured)
    return matchesSearch && item.category === menuFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredMenu.length / itemsPerPage))
  const paginatedMenu = filteredMenu.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">

      {/* Main Section Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A3D] tracking-tight">Food Menu Catalog</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage individual restaurant dishes, prices, portion sizes, and stock availability.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsManageCategoriesModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-400 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base text-gray-600">settings</span>
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPackageModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base text-amber-700">bento</span>
            <span>+ Create Package Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDishModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#9B0B21] text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
          >
            <span className="material-icons text-base">add_circle</span>
            <span>Add New Dish Item</span>
          </button>
        </div>
      </header>

      {/* TOOLBAR FILTER BAR COMPONENT */}
      <MenuFilterBar
        menuSearchQuery={menuSearchQuery}
        handleSearchInputChange={handleSearchInputChange}
        setMenuSearchQuery={setMenuSearchQuery}
        setCurrentPage={setCurrentPage}
        menuFilter={menuFilter}
        categories={categories}
        filteredMenuCount={filteredMenu.length}
        menuItems={menuItems}
        categoryScrollRef={categoryScrollRef}
        handleCategoryWheelScroll={handleCategoryWheelScroll}
        handleSelectCategoryFilter={handleSelectCategoryFilter}
      />

      {/* SKELETON LOADING VIEW OR GRID MENU CARDS LAYOUT OR EMPTY STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, idx) => (
            <DishCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredMenu.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-400 shadow-md p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Centered Red Gradient Icon Badge */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-b from-red-50 to-red-100/70 text-[#C8102E] flex items-center justify-center border border-red-300 shadow-sm shrink-0">
            <span className="material-icons text-4xl text-[#C8102E]">search_off</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-[#071A3D] tracking-tight">No Matching Dishes Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed font-medium">
              {menuSearchQuery ? (
                <>We couldn't find any dish matching "<span className="font-bold text-[#071A3D]">{menuSearchQuery}</span>". Try checking for spelling errors or searching by ingredient.</>
              ) : (
                <>There are currently no food menu catalog entries listed under this category filter.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(menuSearchQuery || menuFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setMenuSearchQuery('')
                  setMenuFilter('all')
                  setCurrentPage(1)
                }}
                className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs border border-gray-400 transition active:scale-95 flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <span className="material-icons text-sm text-gray-600">restart_alt</span>
                <span>Reset Search & Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddDishModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-icons text-sm">add_circle</span>
              <span>Add New Dish Item</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedMenu.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-lg border border-gray-400 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 text-[#071A3D]"
            >
              <div
                onClick={() => setSelectedDishDetail(item)}
                className="cursor-pointer space-y-3"
              >
                {/* 1. DISH PHOTO CONTAINER */}
                <div className="relative h-44 w-full bg-gray-900 overflow-hidden border-b border-gray-300">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Left Interactive Featured Star Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFeatured(item.id)
                    }}
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md backdrop-blur-md border transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 ${item.is_featured
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-black/50 text-white/80 border-white/30 hover:bg-black/70 hover:text-white'
                      }`}
                    title={item.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                  >
                    <span className="material-icons text-[11px]">{item.is_featured ? 'star' : 'star_border'}</span>
                    <span>{item.is_featured ? 'FEATURED' : 'FEATURE'}</span>
                  </button>

                  {/* Top Right Interactive Availability Pill Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleStock(item.id)
                    }}
                    className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md text-[9px] font-black shadow-md backdrop-blur-md border transition-all active:scale-95 cursor-pointer ${item.availability === 'Available'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                      : 'bg-red-950/90 text-red-300 border-red-500/60'
                      }`}
                    title="Click to toggle availability"
                  >
                    {item.availability === 'Available' ? '● AVAILABLE' : '○ SOLD OUT'}
                  </button>

                  {/* Bottom Left Image Overlay: Prep Time */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/20 flex items-center gap-1">
                      <span className="material-icons text-xs text-amber-400">schedule</span>
                      <span>{item.prep_time || '20 mins'}</span>
                    </span>
                  </div>
                </div>

                {/* 2. CARD CONTENT BODY */}
                <div className="px-4 space-y-2.5">
                  {/* Title & Price Header Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-sm text-[#071A3D] group-hover:text-[#C8102E] transition-colors truncate tracking-tight">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug font-medium mt-0.5">
                        {item.description || 'Signature chef preparation cooked fresh to order.'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#C8102E] tracking-tight block">
                        ₱{item.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Specs & Allergens Badges */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between bg-gray-50 px-2.5 py-1 rounded-md border border-gray-300">
                      <span className="flex items-center gap-1 font-bold text-gray-500">
                        <span className="material-icons text-xs text-blue-600">inventory_2</span>
                        <span>Portion:</span>
                      </span>
                      <span className="font-black text-[#071A3D] truncate max-w-[130px]">{item.serving_size || '1 Serving'}</span>
                    </div>

                    {item.allergens && item.allergens.toLowerCase() !== 'none' ? (
                      <div className="flex items-center justify-between bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-300">
                        <span className="flex items-center gap-1 font-extrabold text-amber-800">
                          <span className="material-icons text-xs text-amber-600">warning_amber</span>
                          <span>Allergens:</span>
                        </span>
                        <span className="font-black text-amber-950 truncate max-w-[130px]">{item.allergens}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50/60 px-2.5 py-1 rounded-md border border-emerald-300">
                        <span className="flex items-center gap-1 font-extrabold text-emerald-800">
                          <span className="material-icons text-xs text-emerald-600">check_circle</span>
                          <span>Allergens:</span>
                        </span>
                        <span className="font-bold text-emerald-900">None</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. STREAMLINED CARD ACTION FOOTER */}
              <div className="p-2.5 bg-gray-50/80 border-t border-gray-400 flex items-center justify-between gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setSelectedDishDetail(item)}
                  className="px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <span className="material-icons text-xs text-blue-600">visibility</span>
                  <span>View</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="px-2.5 py-1.5 rounded-md bg-white hover:bg-gray-100 border border-gray-400 text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <span className="material-icons text-xs text-[#C8102E]">edit</span>
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDish(item.id, item.name)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300 cursor-pointer transition"
                    title="Delete Dish"
                  >
                    <span className="material-icons text-base">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!isLoading && filteredMenu.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMenu.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="dish items"
        />
      )}

      {/* VIEW DISH MODAL (READ-ONLY) */}
      {selectedDishDetail && (
        <ViewDishModal
          dish={selectedDishDetail}
          onClose={() => setSelectedDishDetail(null)}
          onEdit={(dishToEdit) => {
            setSelectedDishDetail(null)
            handleOpenEditModal(dishToEdit)
          }}
        />
      )}

      {/* EDIT DISH MODAL */}
      <EditDishModal
        isOpen={isEditDishModalOpen}
        editingDish={editingDish}
        onClose={() => setIsEditDishModalOpen(false)}
        handleEditDishSubmit={handleEditDishSubmit}
        editName={editName}
        setEditName={setEditName}
        editCategory={editCategory}
        setEditCategory={setEditCategory}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        editServingSize={editServingSize}
        setEditServingSize={setEditServingSize}
        editPrepTime={editPrepTime}
        setEditPrepTime={setEditPrepTime}
        editAvailability={editAvailability}
        setEditAvailability={setEditAvailability}
        editImage={editImage}
        setEditImage={setEditImage}
        editIngredients={editIngredients}
        setEditIngredients={setEditIngredients}
        editAllergens={editAllergens}
        setEditAllergens={setEditAllergens}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        editIsFeatured={editIsFeatured}
        setEditIsFeatured={setEditIsFeatured}
        handleFileUpload={handleFileUpload}
        categories={categories}
      />

      {/* ADD DISH MODAL */}
      <AddDishModal
        isOpen={isAddDishModalOpen}
        onClose={() => setIsAddDishModalOpen(false)}
        handleAddDishSubmit={handleAddDishSubmit}
        formName={formName}
        setFormName={setFormName}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPrice={formPrice}
        setFormPrice={setFormPrice}
        formServingSize={formServingSize}
        setFormServingSize={setFormServingSize}
        formPrepTime={formPrepTime}
        setFormPrepTime={setFormPrepTime}
        formImage={formImage}
        setFormImage={setFormImage}
        formIngredients={formIngredients}
        setFormIngredients={setFormIngredients}
        formAllergens={formAllergens}
        setFormAllergens={setFormAllergens}
        formIsFeatured={formIsFeatured}
        setFormIsFeatured={setFormIsFeatured}
        handleFileUpload={handleFileUpload}
        categories={categories}
      />

      {/* MANAGE CATEGORIES MODAL */}
      <CategoryManagementModal
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        categories={categories}
        handleAddCategorySubmit={handleAddCategorySubmit}
        newCatLabel={newCatLabel}
        setNewCatLabel={setNewCatLabel}
        newCatStatus={newCatStatus}
        setNewCatStatus={setNewCatStatus}
        newCatDescription={newCatDescription}
        setNewCatDescription={setNewCatDescription}
        editingCatId={editingCatId}
        setEditingCatId={setEditingCatId}
        editingCatLabel={editingCatLabel}
        setEditingCatLabel={setEditingCatLabel}
        editingCatStatus={editingCatStatus}
        setEditingCatStatus={setEditingCatStatus}
        editingCatDescription={editingCatDescription}
        setEditingCatDescription={setEditingCatDescription}
        handleSaveEditCategory={handleSaveEditCategory}
        handleDeleteCategory={handleDeleteCategory}
      />

      {/* REUSABLE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant="danger"
      />

      {/* CREATE PACKAGE MENU MODAL (IN-PLACE) */}
      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onSaveSuccess={() => {
          showToast('Package menu created successfully for customers!', 'success')
        }}
        passedCategories={categories}
        passedMenuItems={menuItems}
      />

    </div>
  )
}

export default MenuManagement
