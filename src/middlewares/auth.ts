import { Request, Response, NextFunction } from 'express'
import { firebaseAdmin } from '../config/firebaseAdmin'
import { User } from '../models/User'

// Middleware: Verify Firebase ID Token
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' })
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Verify ID token with Firebase Admin SDK
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
    const { uid, email, name, picture } = decoded

    if (!email) {
      return res.status(400).json({ error: 'Email is required in token' })
    }

    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid })

    if (!user) {
      // Auto-register new user
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0],
        role: 'CONSUMER', // default role
        avatar: picture,  // optional: save Google profile picture
      })
    }

    // Attach user object to req
    req.user = user
    next()
  } catch (err) {
    console.error('[AUTH ERROR]', err)
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' })
  }
}