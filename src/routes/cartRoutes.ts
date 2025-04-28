// src/routes/cartRoutes.ts
import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import Cart from '../models/Cart'
import { Product }              from '../models/Product'  // named export

const router = Router()

// ─── helpers ────────────────────────────────────────────────────────────────
async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ userId }).populate('items.productId')
  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
    cart = await cart.populate('items.productId')
  }
  return cart
}

// ─── GET current cart ───────────────────────────────────────────────────────
router.get('/', verifyFirebaseToken, async (req, res) => {
  const cart = await getOrCreateCart(req.user!._id)
  res.json(cart)
})

// ─── POST add new item ──────────────────────────────────────────────────────
router.post('/', verifyFirebaseToken, async (req, res) => {
  const { productId, qty = 1 } = req.body
  if (!productId) {
    return res.status(400).json({ error: 'productId is required' })
  }
  if (qty < 1) {
    return res.status(400).json({ error: 'qty must be at least 1' })
  }

  // verify it exists and there’s enough stock
  const product = await Product.findById(productId)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (product.stock < qty) {
    return res
      .status(400)
      .json({ error: `Only ${product.stock} left in stock` })
  }

  const cart = await getOrCreateCart(req.user!._id)

  const idx = cart.items.findIndex((i) =>
    i.productId._id.equals(productId)
  )
  if (idx === -1) {
    cart.items.push({ productId, qty })
  } else {
    cart.items[idx].qty += qty
  }

  await cart.save()
  await cart.populate('items.productId')
  res.json(cart)
})

// ─── PATCH update quantity ──────────────────────────────────────────────────
router.patch('/:productId', verifyFirebaseToken, async (req, res) => {
  const { productId } = req.params
  const { qty } = req.body
  if (typeof qty !== 'number' || qty < 1) {
    return res.status(400).json({ error: 'Valid qty required' })
  }

  const product = await Product.findById(productId)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (product.stock < qty) {
    return res
      .status(400)
      .json({ error: `Only ${product.stock} left in stock` })
  }

  const cart = await getOrCreateCart(req.user!._id)
  const item = cart.items.find((i) =>
    i.productId._id.equals(productId)
  )
  if (!item) return res.status(404).json({ error: 'Item not in cart' })

  item.qty = qty
  await cart.save()
  await cart.populate('items.productId')
  res.json(cart)
})

// ─── DELETE one item ───────────────────────────────────────────────────────
router.delete('/:productId', verifyFirebaseToken, async (req, res) => {
  const { productId } = req.params
  const cart = await getOrCreateCart(req.user!._id)

  cart.items = cart.items.filter((i) =>
    !i.productId._id.equals(productId)
  )

  await cart.save()
  await cart.populate('items.productId')
  res.json(cart)
})

// ─── DELETE clear cart ──────────────────────────────────────────────────────
router.delete('/', verifyFirebaseToken, async (req, res) => {
  const cart = await getOrCreateCart(req.user!._id)
  cart.items = []
  await cart.save()
  await cart.populate('items.productId')
  res.json(cart)
})

export default router