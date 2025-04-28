import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { connectDB } from './config/mongo'
import { firebaseAdmin } from './config/firebaseAdmin'

// Route imports
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import productRoutes from './routes/productRoutes'
import orderRoutes from './routes/orderRoutes'
import paymentRoutes from './routes/paymentRoutes'
import reviewRoutes from './routes/reviewRoutes'
import adminRoutes from './routes/adminRoutes'
import aiRoutes from './routes/aiRoutes'
import chatRoutes from './routes/chatRoutes'
import weatherRoutes from './routes/weatherRoutes'
import cartRoutes from './routes/cartRoutes';


dotenv.config()

const app = express()

// Setup Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
)
app.use(helmet())

// ⚠️ Important: Only for Webhooks that need raw body
if (process.env.NODE_ENV === 'production') {
  app.post('/api/payment/webhook', express.raw({ type: 'application/json' }))
}

// Normal JSON parsing for all other routes
app.use(express.json())

// Connect to MongoDB
connectDB()

// Health Check
app.get('/', (req, res) => {
  res.send('🚀 Farm-To-Kitchen API is Live')
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/cart', cartRoutes);

// Global Error Handler (optional)
// app.use((err, req, res, next) => { ... })

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`)
})