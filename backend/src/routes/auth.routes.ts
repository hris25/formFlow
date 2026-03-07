import { Router } from 'express'
import {
  register,
  login,
  me,
  updateProfile,
  updatePassword,
  logout,
} from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)
router.put('/me', authMiddleware, updateProfile)
router.put('/password', authMiddleware, updatePassword)

export default router