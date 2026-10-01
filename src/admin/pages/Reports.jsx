import React from 'react'
import MainDashboard from './Dashboard'

function Reports({ staffUser, searchQuery = '' }) {
  return <MainDashboard activeTab="analytics" staffUser={staffUser} searchQuery={searchQuery} />
}

export default Reports
