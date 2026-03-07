import { Router } from 'express'
import { getInsights } from '../controllers/ai.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/:formId/insights', authMiddleware, getInsights)

export default router