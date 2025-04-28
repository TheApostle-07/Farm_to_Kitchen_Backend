import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId
  recipientId: mongoose.Types.ObjectId
  text: string
  createdAt: Date
}

const messageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true })

export const Message = mongoose.model<IMessage>('Message', messageSchema)