import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  farmerId: mongoose.Types.ObjectId
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  organic: boolean
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
}

const productSchema = new Schema<IProduct>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  imageUrl: String,
  organic: { type: Boolean, default: false },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
}, { timestamps: true })

productSchema.index({ location: '2dsphere' })

export const Product = mongoose.model<IProduct>('Product', productSchema)