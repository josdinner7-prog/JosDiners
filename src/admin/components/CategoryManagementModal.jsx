import React from 'react'

export default function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  handleAddCategorySubmit,
  newCatLabel,
  setNewCatLabel,
  newCatStatus,
  setNewCatStatus,
  newCatDescription,
  setNewCatDescription,
  editingCatId,
  setEditingCatId,
  editingCatLabel,
  setEditingCatLabel,
  editingCatStatus,
  setEditingCatStatus,
  editingCatDescription,
  setEditingCatDescription,
  handleSaveEditCategory,
  handleDeleteCategory,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-gray-400 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto text-[#071A3D]">
        
        {/* Modal Header */}
        <header className="bg-white border-b border-gray-300 p-3 sm:p-3.5 px-3.5 sm:px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center font-bold border border-[#C8102E]/30 shrink-0">
              <span className="material-icons text-base">category</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-[#071A3D] tracking-tight">Manage Food Categories</h3>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#C8102E] text-[10px] font-black">
                  {categories.filter(c => c.id !== 'all').length} Categories
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium truncate">Add, update, or remove menu category filters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              setEditingCatId(null)
            }}
            className="w-7 h-7 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </header>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs font-semibold text-gray-800 bg-gray-50/40">
          
          {/* SECTION 1: Add New Category Form */}
          <form onSubmit={handleAddCategorySubmit} className="p-3 sm:p-3.5 bg-gradient-to-r from-red-50/40 to-white rounded-xl border border-red-200 shadow-2xs space-y-3">
            <h4 className="font-black text-[11px] text-[#C8102E] uppercase tracking-wider flex items-center gap-1.5 border-b border-red-100 pb-1.5">
              <span className="material-icons text-xs">add_circle</span>
              <span>Create New Category</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-7">
                <label className="block text-gray-700 font-bold mb-1 text-[10px]">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House Chef Specials"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-[#071A3D] focus:outline-none focus:border-[#C8102E]"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-gray-700 font-bold mb-1 text-[10px]">Catalog Status</label>
                <select
                  value={newCatStatus}
                  onChange={(e) => setNewCatStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#C8102E]"
                >
                  <option value="Active">● Active (Visible)</option>
                  <option value="Inactive">○ Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-2.5">
              <div className="flex-1 w-full">
                <label className="block text-gray-700 font-bold mb-1 text-[10px]">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief culinary summary for menu header..."
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#C8102E]"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 bg-[#C8102E] hover:bg-[#9B0B21] text-white font-black text-xs rounded-lg transition cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1 shrink-0"
              >
                <span className="material-icons text-xs">add</span>
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* SECTION 2: Existing Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="font-extrabold text-[11px] text-gray-500 uppercase tracking-wider">Catalog Categories List</h4>
              <span className="text-[10px] font-bold text-gray-400">Total: {categories.length}</span>
            </div>

            <div className="divide-y divide-gray-200 bg-white rounded-xl border border-gray-300 overflow-hidden shadow-2xs">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 transition hover:bg-gray-50/80">
                  {editingCatId === cat.id ? (
                    /* Inline Category Edit Card */
                    <div className="space-y-2.5 bg-amber-50/70 p-3 rounded-lg border border-amber-300 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-1.5 flex-wrap gap-1">
                        <span className="font-black text-xs text-amber-900 flex items-center gap-1">
                          <span className="material-icons text-xs text-amber-600">edit</span>
                          <span>Editing Category: "{cat.label}"</span>
                        </span>
                        <span className="text-[9px] font-bold text-amber-700">ID: {cat.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-8">
                          <label className="block text-gray-700 font-bold text-[10px] mb-1">Category Title *</label>
                          <input
                            type="text"
                            required
                            value={editingCatLabel}
                            onChange={(e) => setEditingCatLabel(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-amber-400 text-xs font-bold focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-gray-700 font-bold text-[10px] mb-1">Status</label>
                          <select
                            value={editingCatStatus}
                            onChange={(e) => setEditingCatStatus(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-md bg-white border border-amber-400 text-xs font-bold focus:outline-none"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold text-[10px] mb-1">Description</label>
                        <input
                          type="text"
                          value={editingCatDescription}
                          onChange={(e) => setEditingCatDescription(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-md bg-white border border-amber-400 text-xs font-medium focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="px-3 py-1.5 rounded-lg border border-gray-400 bg-white text-gray-700 font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          Save Category
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Category Row Display */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-[#071A3D]">{cat.label}</span>
                          
                          {cat.status === 'Inactive' ? (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-300 font-bold text-[9px]">
                              ○ Inactive
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[9px]">
                              ● Active
                            </span>
                          )}

                          {cat.id === 'all' && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-300 font-extrabold text-[9px]">
                              System Filter
                            </span>
                          )}
                        </div>
                        {cat.description ? (
                          <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{cat.description}</p>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic mt-0.5">No description specified</p>
                        )}
                      </div>

                      {cat.id !== 'all' && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id)
                              setEditingCatLabel(cat.label)
                              setEditingCatDescription(cat.description || '')
                              setEditingCatStatus(cat.status || 'Active')
                            }}
                            className="px-2.5 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          >
                            <span className="material-icons text-xs">edit</span>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.label)}
                            className="px-2.5 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-0.5 shadow-2xs active:scale-95"
                          >
                            <span className="material-icons text-xs">delete</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
