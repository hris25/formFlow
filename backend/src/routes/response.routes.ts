import { Router } from 'express'
import {
  getPublicForm,
  submitResponse,
} from '../controllers/response.controller'

const router = Router()

// Routes publiques — pas de JWT
router.get('/:token', getPublicForm)
router.post('/:token', submitResponse)

export default router