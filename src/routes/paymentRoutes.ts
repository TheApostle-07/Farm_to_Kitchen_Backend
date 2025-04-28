import express, { Router, Request, Response } from 'express'
import Razorpay from 'razorpay'
import { verifyFirebaseToken } from '../middlewares/auth'
import dotenv from 'dotenv'
dotenv.config()
const router = Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

// @desc   Create Razorpay order
// @route  POST /api/payment/checkout
router.post(
  '/checkout',
  verifyFirebaseToken,
  async (req: Request, res: Response) => {
    const { amount, currency = 'INR', receipt } = req.body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount value' })
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt: receipt || `order_rcptid_${Date.now()}`
      }
      const order = await razorpay.orders.create(options)
      res.json({ success: true, order })
    } catch (err) {
      console.error('[RAZORPAY ERROR]', err)
      res.status(500).json({ error: 'Failed to create Razorpay order' })
    }
  }
)

export default router
