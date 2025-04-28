// src/models/Order.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItem {
  productId:  mongoose.Types.ObjectId
  farmerId:   mongoose.Types.ObjectId
  qty:        number
  price:      number
}

export interface IOrder extends Document {
  consumerId:   mongoose.Types.ObjectId
  items:        IOrderItem[]
  totalAmount:  number
  status:       'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  farmerId:  { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  qty:       { type: Number,                              required: true, min: 1 },
  price:     { type: Number,                              required: true, min: 0 }
})

const orderSchema = new Schema<IOrder>({
  consumerId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items:       {
    type:     [orderItemSchema],
    validate: [(arr: any[]) => arr.length > 0, 'At least one order item is required']
  },
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
})

export const Order = mongoose.model<IOrder>('Order', orderSchema)