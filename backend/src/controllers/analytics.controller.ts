import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'

// ─── Types ─────────────────────────────────────────────────

type QuestionType = 'multiple_choice' | 'open' | 'yes_no' | 'rating'

interface BaseAnalytics {
  questionId: string
  label: string
  type: QuestionType
  totalAnswers: number
}

interface MultipleChoiceAnalytics extends BaseAnalytics {
  type: 'multiple_choice'
  // { "Oui": 12, "Non": 5 }
  distribution: Record<string, number>
  // [{ label: "Oui", count: 12, percentage: 70.6 }]
  chart: { label: string; count: number; percentage: number }[]
}

interface YesNoAnalytics extends BaseAnalytics {
  type: 'yes_no'
  distribution: { yes: number; no: number }
  chart: { label: string; count: number; percentage: number }[]
}

interface RatingAnalytics extends BaseAnalytics {
  type: 'rating'
  average: number
  min: number
  max: number
  // { "1": 2, "2": 5, "3": 8, "4": 12, "5": 3 }
  distribution: Record<string, number>
  chart: { label: string; count: number; percentage: number }[]
}

interface OpenAnalytics extends BaseAnalytics {
  type: 'open'
  // Toutes les réponses texte brutes
  answers: string[]
}

type QuestionAnalytics =
  | MultipleChoiceAnalytics
  | YesNoAnalytics
  | RatingAnalytics
  | OpenAnalytics

// ─── Helper ────────────────────────────────────────────────

const analyzeQuestion = (
  questionId: string,
  label: string,
  type: string,
  rawAnswers: string[]
): QuestionAnalytics => {
  const totalAnswers = rawAnswers.length

  if (type === 'multiple_choice') {
    const distribution: Record<string, number> = {}
    rawAnswers.forEach(raw => {
      const value = JSON.parse(raw)
      const values: string[] = Array.isArray(value) ? value : [value]
      values.forEach(v => {
        distribution[v] = (distribution[v] || 0) + 1
      })
    })
    const chart = Object.entries(distribution).map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / totalAnswers) * 100 * 10) / 10,
    }))
    return { questionId, label, type: 'multiple_choice', totalAnswers, distribution, chart }
  }

  if (type === 'yes_no') {
    const distribution = { yes: 0, no: 0 }
    rawAnswers.forEach(raw => {
      const value = JSON.parse(raw)
      const normalized = String(value).toLowerCase()
      if (['true', 'yes', 'oui', '1'].includes(normalized)) distribution.yes++
      else distribution.no++
    })
    const chart = [
      { label: 'Oui', count: distribution.yes, percentage: Math.round((distribution.yes / totalAnswers) * 100 * 10) / 10 },
      { label: 'Non', count: distribution.no, percentage: Math.round((distribution.no / totalAnswers) * 100 * 10) / 10 },
    ]
    return { questionId, label, type: 'yes_no', totalAnswers, distribution, chart }
  }

  if (type === 'rating') {
    const nums = rawAnswers.map(raw => Number(JSON.parse(raw))).filter(n => !isNaN(n))
    const distribution: Record<string, number> = {}
    nums.forEach(n => {
      const key = String(n)
      distribution[key] = (distribution[key] || 0) + 1
    })
    const average = nums.length > 0
      ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
      : 0
    const chart = Object.entries(distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / totalAnswers) * 100 * 10) / 10,
      }))
    return {
      questionId,
      label,
      type: 'rating',
      totalAnswers,
      average,
      min: nums.length > 0 ? Math.min(...nums) : 0,
      max: nums.length > 0 ? Math.max(...nums) : 0,
      distribution,
      chart,
    }
  }

  // open
  const answers = rawAnswers.map(raw => String(JSON.parse(raw)))
  return { questionId, label, type: 'open', totalAnswers, answers }
}

// ─── Controllers ───────────────────────────────────────────

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        responses: { include: { answers: true } },
      },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const totalResponses = form.responses.length

    const analytics: QuestionAnalytics[] = form.questions.map(question => {
      const rawAnswers = form.responses
        .flatMap(r => r.answers)
        .filter(a => a.questionId === question.id)
        .map(a => a.value)

      return analyzeQuestion(question.id, question.label, question.type, rawAnswers)
    })

    res.json({
      formId: form.id,
      title: form.title,
      totalResponses,
      analytics,
    })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const getQuestionAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { questions: true },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const question = form.questions.find(q => q.id === req.params.qid)
    if (!question) return res.status(404).json({ message: 'Question introuvable' })

    const answers = await prisma.answer.findMany({
      where: { questionId: req.params.qid },
      select: { value: true },
    })

    const rawAnswers = answers.map(a => a.value)
    const analytics = analyzeQuestion(question.id, question.label, question.type, rawAnswers)

    res.json(analytics)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}