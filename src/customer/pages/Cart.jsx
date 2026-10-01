import React from 'react'
import CartDrawer from '../../components/CartDrawer'

function Cart(props) {
  return <CartDrawer {...props} isOpen={true} />
}

export default Cart
