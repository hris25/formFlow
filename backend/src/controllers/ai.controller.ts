import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { analyzeForm, analyzeOpenQuestion } from '../services/ai.service'

export const getInsights = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        responses: { include: { answers: true } },
      },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })
    if (form.responses.length === 0)
      return res.status(400).json({ message: 'Aucune réponse pour le moment' })

    const insights = await analyzeForm(form)
    res.json(insights)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' })
  }
}

export const getQuestionInsights = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { questions: true },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const question = form.questions.find(q => q.id === req.params.qid)
    if (!question) return res.status(404).json({ message: 'Question introuvable' })
    if (question.type !== 'open')
      return res.status(400).json({ message: 'Cette route est réservée aux questions ouvertes' })

    const answers = await prisma.answer.findMany({
      where: { questionId: req.params.qid },
      select: { value: true },
    })

    if (answers.length === 0)
      return res.status(400).json({ message: 'Aucune réponse pour cette question' })

    const rawAnswers = answers.map(a => String(JSON.parse(a.value)))
    const insights = await analyzeOpenQuestion(question.label, rawAnswers)

    res.json(insights)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur lors de l\'analyse IA' })
  }
}