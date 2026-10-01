import React from 'react'

export default function PaginationControls({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 8,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) {
  const safeTotalPages = Math.max(1, totalPages)
  const startItem = totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers array with ellipsis logic
  const getPageNumbers = () => {
    const pages = []
    const MAX_VISIBLE = 5

    if (safeTotalPages <= MAX_VISIBLE) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 1)
      let end = Math.min(safeTotalPages, currentPage + 1)

      if (currentPage <= 2) {
        start = 1
        end = 3
      } else if (currentPage >= safeTotalPages - 1) {
        start = safeTotalPages - 2
        end = safeTotalPages
      }

      if (start > 1) {
        pages.push(1)
        if (start > 2) pages.push('...')
      }

      for (let i = start; i <= end; i++) pages.push(i)

      if (end < safeTotalPages) {
        if (end < safeTotalPages - 1) pages.push('...')
        pages.push(safeTotalPages)
      }
    }
    return pages
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-300 dark:border-slate-700 text-xs font-semibold ${className}`}>
      
      {/* Left: Items Summary Counter */}
      <div className="text-gray-500 dark:text-gray-400 text-center sm:text-left font-medium">
        Showing <strong className="text-[#071A3D] dark:text-white font-black">{startItem}</strong> to <strong className="text-[#071A3D] dark:text-white font-black">{endItem}</strong> of <strong className="text-[#071A3D] dark:text-white font-black">{totalItems}</strong> {itemLabel}
      </div>

      {/* Right: Clean Page Controls Group */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 flex items-center gap-0.5 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 dark:bg-slate-800/40 dark:text-gray-600 border border-gray-200 dark:border-slate-800 cursor-not-allowed opacity-60'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 hover:border-[#C8102E] hover:text-[#C8102E] shadow-2xs'
          }`}
        >
          <span className="material-icons text-sm">chevron_left</span>
          <span>Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 dark:text-gray-500 font-black select-none text-xs">
                  ...
                </span>
              )
            }

            const isCurrent = page === currentPage
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange && onPageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-[#C8102E] text-white shadow-xs border border-[#C8102E]'
                    : 'bg-white dark:bg-slate-900 text-[#071A3D] dark:text-gray-200 border border-gray-300 dark:border-slate-700 hover:border-[#C8102E] hover:text-[#C8102E] shadow-2xs'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer active:scale-95 flex items-center gap-0.5 ${
            currentPage >= safeTotalPages
              ? 'bg-gray-100 text-gray-400 dark:bg-slate-800/40 dark:text-gray-600 border border-gray-200 dark:border-slate-800 cursor-not-allowed opacity-60'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 hover:border-[#C8102E] hover:text-[#C8102E] shadow-2xs'
          }`}
        >
          <span>Next</span>
          <span className="material-icons text-sm">chevron_right</span>
        </button>

        {/* Direct Page Jump Selector - Only rendered when safeTotalPages > 1 */}
        {safeTotalPages > 1 && (
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-600 dark:text-gray-300 pl-2.5 border-l border-gray-300 dark:border-slate-700 my-0.5">
            <span>Page</span>
            <select
              value={currentPage}
              onChange={(e) => onPageChange && onPageChange(Number(e.target.value))}
              className="px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-black text-[#071A3D] dark:text-gray-100 focus:outline-none focus:border-[#C8102E] cursor-pointer shadow-2xs"
            >
              {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span>of {safeTotalPages}</span>
          </div>
        )}

      </div>
    </div>
  )
}
