import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  consumerId: mongoose.Types.ObjectId
  rating: number
  comment?: string
}

const reviewSchema = new Schema<IReview>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  consumerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true })

reviewSchema.index({ productId: 1, consumerId: 1 }, { unique: true })

export const Review = mongoose.model<IReview>('Review', reviewSchema)