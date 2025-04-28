// src/routes/chatRoutes.ts
import { Router } from 'express'
import mongoose from 'mongoose'
import { verifyFirebaseToken } from '../middlewares/auth'
import { Message } from '../models/Message'
import { User } from '../models/User'

const router = Router()

/* ------------------------------------------------------------------ */
/* 0️⃣  (One-time) ensure an efficient index                           */
/* ------------------------------------------------------------------ */
// Put this in models/Message.ts if you haven’t already:
//
// MessageSchema.index(
//   { senderId: 1, recipientId: 1, createdAt: 1 },
//   { name: 'byParticipantsAndTime' }
// )

/* ------------------------------------------------------------------ */
/* 1️⃣  INBOX – latest message per conversation                        */
/*     GET /api/chat                                                  */
/* ------------------------------------------------------------------ */
router.get('/', verifyFirebaseToken, async (req, res) => {
  const myId = new mongoose.Types.ObjectId(req.user!._id)

  const inbox = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: myId },
          { recipientId: myId }
        ]
      }
    },
    {
      // Determine who the “other person” is for each row
      $addFields: {
        partnerId: {
          $cond: [{ $eq: ['$senderId', myId] }, '$recipientId', '$senderId']
        }
      }
    },
    { $sort: { createdAt: -1 } },          // newest first
    {
      $group: {
        _id: '$partnerId',
        lastMessage: { $first: '$text'   },
        updatedAt:   { $first: '$createdAt' }
      }
    },
    // bring in partner’s basic profile
    {
      $lookup: {
        from: 'users',                      // collection name in Mongo
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    { $unwind: '$partner' },
    {
      $project: {
        _id: 0,
        user: {
          _id:   '$partner._id',
          name:  '$partner.name',
          email: '$partner.email',          // add avatar, role, etc. if desired
        },
        lastMessage: 1,
        updatedAt:   1
      }
    },
    { $sort: { updatedAt: -1 } }           // conversations list order
  ])

  res.json(inbox)
})

/* ------------------------------------------------------------------ */
/* 2️⃣  FULL THREAD WITH ONE PARTNER                                   */
/*     GET /api/chat/:partnerId                                       */
/* ------------------------------------------------------------------ */
router.get('/:partnerId', verifyFirebaseToken, async (req, res) => {
  const { partnerId } = req.params
  const myId = req.user!._id

  const messages = await Message.find({
    $or: [
      { senderId: myId,       recipientId: partnerId },
      { senderId: partnerId,  recipientId: myId }
    ]
  }).sort({ createdAt: 1 })

  res.json(messages)
})

/* ------------------------------------------------------------------ */
/* 3️⃣  SEND A MESSAGE                                                 */
/*     POST /api/chat/:recipientId                                    */
/* ------------------------------------------------------------------ */
router.post('/:recipientId', verifyFirebaseToken, async (req, res) => {
  const { recipientId } = req.params
  const { text } = req.body

  if (!text) {
    return res.status(400).json({ error: 'Message text is required' })
  }

  const recipient = await User.findById(recipientId)
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' })
  }

  const message = await Message.create({
    senderId:     req.user!._id,
    recipientId:  recipientId,
    text
  })

  res.status(201).json({ message: 'Message sent', data: message })
})

export default router