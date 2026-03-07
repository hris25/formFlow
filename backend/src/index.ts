import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes'
import formRoutes from './routes/form.routes'
import responseRoutes from './routes/response.routes'
import aiRoutes from './routes/ai.routes'
import { errorMiddleware } from './middlewares/error.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/forms', formRoutes)
app.use('/api/respond', responseRoutes)
app.use('/api/ai', aiRoutes)

app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})