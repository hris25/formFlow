import { Router } from 'express'
import {
  getForms, getForm, createForm, updateForm,
  deleteForm, toggleForm, addQuestion, updateQuestion,
  deleteQuestion, reorderQuestions,
} from '../controllers/form.controller'
import {
  getResponses, getResponse, deleteResponse,
} from '../controllers/response.controller'
import { getInsights, getQuestionInsights } from '../controllers/ai.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { getAnalytics, getQuestionAnalytics } from '../controllers/analytics.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', getForms)
router.get('/:id', getForm)
router.post('/', createForm)
router.put('/:id', updateForm)
router.delete('/:id', deleteForm)
router.patch('/:id/toggle', toggleForm)

router.post('/:id/questions', addQuestion)
router.put('/:id/questions/reorder', reorderQuestions)
router.put('/:id/questions/:qid', updateQuestion)
router.delete('/:id/questions/:qid', deleteQuestion)

router.get('/:id/responses', getResponses)
router.get('/:id/responses/:rid', getResponse)
router.delete('/:id/responses/:rid', deleteResponse)

router.get('/:id/analytics', getAnalytics)
router.get('/:id/analytics/:qid', getQuestionAnalytics)

router.get('/:id/insights', getInsights)
router.get('/:id/insights/:qid', getQuestionInsights)

export default router