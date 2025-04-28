import { Router } from 'express'
import { verifyFirebaseToken } from '../middlewares/auth'
import { Review } from '../models/Review'
import { Product } from '../models/Product'

const router = Router()

// @desc   Submit a review for a product
// @route  POST /api/reviews/:productId
router.post('/:productId', verifyFirebaseToken, async (req, res) => {
  const { productId } = req.params
  const { rating, comment } = req.body

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' })
  }

  const product = await Product.findById(productId)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const existingReview = await Review.findOne({
    productId,
    consumerId: req.user?._id
  })

  if (existingReview) {
    // Optional: update existing review
    existingReview.rating = rating
    existingReview.comment = comment
    await existingReview.save()
    return res.json({ message: 'Review updated', review: existingReview })
  }

  const review = await Review.create({
    productId,
    consumerId: req.user?._id,
    rating,
    comment
  })

  res.status(201).json({ message: 'Review submitted', review })
})

// @desc   Get all reviews for a product
// @route  GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  const { productId } = req.params

  const reviews = await Review.find({ productId })
    .populate('consumerId', 'name')
    .sort({ createdAt: -1 })

  res.json(reviews)
})

export default router