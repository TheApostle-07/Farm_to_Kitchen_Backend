// src/models/Cart.ts
import { Schema, model } from 'mongoose'

const CartItem = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:       { type: Number, default: 1 }
}, { _id: true })

const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  items:  [CartItem]
}, { timestamps: true })

export default model('Cart', CartSchema)