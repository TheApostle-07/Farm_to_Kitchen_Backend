import { Router, Request, Response } from 'express'
import { getAuth } from 'firebase-admin/auth'
// Note: no need to import firebaseAdmin here since getAuth() uses the default App
import { User } from '../models/User'

const router = Router()

// @desc   Sign up (create new user)
// @route  POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Verify the Firebase ID token using the default initialized app
    const decoded = await getAuth().verifyIdToken(token)
    const { uid, email, name, picture } = decoded

    if (!email) {
      return res.status(400).json({ error: 'Email missing in token payload' })
    }

    // Prevent double-signup
    const existing = await User.findOne({ firebaseUid: uid })
    if (existing) {
      return res.status(400).json({ error: 'User already registered' })
    }

    // Create new user document
    const user = new User({
      firebaseUid: uid,
      email,
      name: name || email.split('@')[0],
      avatar: picture,
      role: 'CONSUMER'  // default role
    })
    await user.save()

    return res.status(201).json({ success: true, user })
  } catch (err) {
    console.error('[AUTH SIGNUP ERROR]', err)
    return res.status(500).json({ error: 'Sign up failed' })
  }
})

// @desc   Log in (verify & return existing user)
// @route  POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Verify the Firebase ID token
    const decoded = await getAuth().verifyIdToken(token)
    const { uid, email } = decoded

    if (!email) {
      return res.status(400).json({ error: 'Email missing in token payload' })
    }

    // Fetch the existing user
    const user = await User.findOne({ firebaseUid: uid })
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found. Please sign up first.' })
    }

    // Return user data, including their role
    return res.json({ success: true, user })
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
