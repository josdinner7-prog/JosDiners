import React from 'react'
import KitchenLayout from '../layouts/KitchenLayout'

function KitchenKDS({ staffUser, onLogout, onSwitchToCustomer }) {
  return (
    <KitchenLayout
      staffUser={staffUser}
      onLogout={onLogout}
      onSwitchToCustomer={onSwitchToCustomer}
    />
  )
}

export default KitchenKDS
