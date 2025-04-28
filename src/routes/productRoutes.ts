import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import { Product } from '../models/Product'
import { isFarmer } from '../middlewares/isFarmer'

const router = Router()

// @desc   Get public product list with filters
// @route  GET /api/products
router.get('/', async (req, res) => {
  const { q, min, max, organic } = req.query
  const filters: any = {}

  if (q) {
    filters.name = { $regex: q, $options: 'i' }
  }

  if (min || max) {
    filters.price = {}
    if (min) filters.price.$gte = Number(min)
    if (max) filters.price.$lte = Number(max)
  }

  if (organic !== undefined) {
    filters.organic = organic === 'true'
  }

  const products = await Product.find(filters).sort({ createdAt: -1 })
  res.json(products)
})

// @desc   Get single product
// @route  GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

// @desc   Farmer creates a new product
// @route  POST /api/products
router.post('/', verifyFirebaseToken, isFarmer, async (req, res) => {
  const { name, description, price, stock, imageUrl, organic } = req.body

  const product = await Product.create({
    farmerId: req.user?._id,
    name,
    description,
    price,
    stock,
    imageUrl,
    organic: !!organic,
    location: req.user?.location
  })

  res.status(201).json(product)
})

// @desc   Farmer updates product
// @route  PUT /api/products/:id
router.put('/:id', verifyFirebaseToken, isFarmer, async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  // Ensure farmer owns this product
  if (product.farmerId.toString() !== req.user?._id.toString()) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { name, description, price, stock, imageUrl, organic } = req.body

  product.name = name || product.name
  product.description = description || product.description
  product.price = price ?? product.price
  product.stock = stock ?? product.stock
  product.imageUrl = imageUrl || product.imageUrl
  product.organic = organic ?? product.organic

  await product.save()
  res.json(product)
})

// @desc   Farmer deletes product
// @route  DELETE /api/products/:id
router.delete('/:id', verifyFirebaseToken, isFarmer, async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  if (product.farmerId.toString() !== req.user?._id.toString()) {
    return res.status(403).json({ error: 'Access denied' })
  }

  await product.deleteOne()
  res.json({ message: 'Product deleted' })
})

export default router