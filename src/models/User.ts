import mongoose, { Schema, Document } from 'mongoose'

export type Role = 'ADMIN' | 'FARMER' | 'CONSUMER'

export interface IUser extends Document {
  firebaseUid: string
  email: string
  name: string
  role: Role
  address?: string
  avatar?: string
  location?: {
    type: 'Point'
    coordinates: [number, number] 
  }
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'FARMER', 'CONSUMER'],
      default: 'CONSUMER'
    },
    address: {
      type: String
    },
    avatar: {
      type: String
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], 
        default: [0, 0]
      }
    }
  },
  {
    timestamps: true
  }
)

userSchema.index({ location: '2dsphere' })

export const User = mongoose.model<IUser>('User', userSchema)