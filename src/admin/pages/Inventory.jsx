import React from 'react'
import MainDashboard from './Dashboard'

function Inventory({ staffUser, searchQuery = '' }) {
  return <MainDashboard activeTab="inventory" staffUser={staffUser} searchQuery={searchQuery} />
}

export default Inventory
