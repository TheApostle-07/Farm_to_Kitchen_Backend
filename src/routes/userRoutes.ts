import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import { User } from '../models/User'
import { Order } from '../models/Order'

const router = Router()

// @desc   Get current logged-in user
// @route  GET /api/users/me
router.get('/me', verifyFirebaseToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  res.json(req.user)
})

// @desc   Update user profile
// @route  PUT /api/users/me
router.put('/me', verifyFirebaseToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const { name, address, coordinates } = req.body

  req.user.name = name || req.user.name
  req.user.address = address || req.user.address

  if (coordinates && coordinates.length === 2) {
    req.user.location = {
      type: 'Point',
      coordinates
    }
  }

  await req.user.save()
  res.json({ message: 'Profile updated', user: req.user })
})

// @desc   Get current user's order history
// @route  GET /api/users/orders
router.get('/orders', verifyFirebaseToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  const orders = await Order.find({ consumerId: req.user._id })
    .populate('items.productId')
    .sort({ createdAt: -1 })

  res.json(orders)
})

export default router