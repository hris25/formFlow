import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middlewares/auth.middleware'
import { z } from 'zod'

// ─── Schemas ───────────────────────────────────────────────

const answerSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
})

const submitSchema = z.object({
  answers: z.array(answerSchema).min(1),
})

// ─── Routes publiques (élèves) ─────────────────────────────

export const getPublicForm = async (req: Request, res: Response) => {
  try {
    const form = await prisma.form.findUnique({
      where: { token: req.params.token },
      include: { questions: { orderBy: { order: 'asc' } } },
    })

    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })
    if (!form.isOpen) return res.status(403).json({ message: 'Ce formulaire est fermé' })

    // On ne renvoie pas les infos sensibles (userId, token interne...)
    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: form.questions.map(q => ({
        id: q.id,
        type: q.type,
        label: q.label,
        options: q.options,
        required: q.required,
        order: q.order,
      })),
    })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const submitResponse = async (req: Request, res: Response) => {
  try {
    const form = await prisma.form.findUnique({
      where: { token: req.params.token },
      include: { questions: true },
    })

    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })
    if (!form.isOpen) return res.status(403).json({ message: 'Ce formulaire est fermé' })

    const { answers } = submitSchema.parse(req.body)

    // Vérifie que les questions requises ont une réponse
    const requiredQuestions = form.questions.filter(q => q.required)
    const answeredIds = answers.map(a => a.questionId)

    const missingRequired = requiredQuestions.filter(q => !answeredIds.includes(q.id))
    if (missingRequired.length > 0) {
      return res.status(400).json({
        message: 'Des questions obligatoires n\'ont pas été répondues',
        missing: missingRequired.map(q => q.id),
      })
    }

    // Vérifie que les questionId existent bien dans ce formulaire
    const validIds = form.questions.map(q => q.id)
    const invalidAnswers = answers.filter(a => !validIds.includes(a.questionId))
    if (invalidAnswers.length > 0) {
      return res.status(400).json({ message: 'Certaines questions sont invalides' })
    }

    const response = await prisma.response.create({
      data: {
        formId: form.id,
        answers: {
          create: answers.map(a => ({
            questionId: a.questionId,
            value: JSON.stringify(a.value),
          })),
        },
      },
      include: { answers: true },
    })

    res.status(201).json({ message: 'Réponse enregistrée', responseId: response.id })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ─── Routes protégées (prof) ───────────────────────────────

export const getResponses = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const responses = await prisma.response.findMany({
      where: { formId: req.params.id },
      include: {
        answers: {
          include: { question: { select: { label: true, type: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Parse les valeurs JSON des réponses
    const parsed = responses.map(r => ({
      ...r,
      answers: r.answers.map(a => ({
        ...a,
        value: JSON.parse(a.value),
      })),
    }))

    res.json(parsed)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const getResponse = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const response = await prisma.response.findFirst({
      where: { id: req.params.rid, formId: req.params.id },
      include: {
        answers: {
          include: { question: { select: { label: true, type: true } } },
        },
      },
    })
    if (!response) return res.status(404).json({ message: 'Réponse introuvable' })

    res.json({
      ...response,
      answers: response.answers.map(a => ({
        ...a,
        value: JSON.parse(a.value),
      })),
    })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const deleteResponse = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const response = await prisma.response.findFirst({
      where: { id: req.params.rid, formId: req.params.id },
    })
    if (!response) return res.status(404).json({ message: 'Réponse introuvable' })

    await prisma.response.delete({ where: { id: req.params.rid } })
    res.json({ message: 'Réponse supprimée' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}