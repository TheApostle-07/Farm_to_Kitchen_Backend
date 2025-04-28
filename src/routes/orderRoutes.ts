// src/routes/orderRoutes.ts
import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import { Order } from '../models/Order'
import { Product } from '../models/Product'

const router = Router()

// @desc   Create a new order
// @route  POST /api/orders
router.post('/', verifyFirebaseToken, async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order items are required' })
  }

  try {
    let totalAmount = 0
    // Build enriched line‐items array
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const { productId, qty } = item
      if (!productId || typeof qty !== 'number' || qty < 1) {
        throw { status: 400, message: 'Each item must include productId and a qty ≥ 1' }
      }

      const product = await Product.findById(productId)
      if (!product) {
        throw { status: 404, message: `Product not found: ${productId}` }
      }
      if (product.stock < qty) {
        throw { status: 400, message: `Insufficient stock for ${product.name}` }
      }

      // Deduct stock
      product.stock -= qty
      await product.save()

      // Compute line total
      totalAmount += product.price * qty

      return {
        productId,
        farmerId: product.farmerId,
        qty,
        price: product.price
      }
    }))

    // Create the order with fully‐populated items + computed totalAmount
    const order = await Order.create({
      consumerId: req.user!._id,
      items:      enrichedItems,
      totalAmount,
      status:     'PENDING'
    })

    return res.status(201).json({ message: 'Order placed', order })
  } catch (err: any) {
    console.error('[Order Create Error]', err)
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message })
    }
    return res.status(500).json({ error: 'Server error while placing order' })
  }
})

export default router