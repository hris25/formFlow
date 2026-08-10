import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

// ─── Schemas ───────────────────────────────────────────────

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'open', 'yes_no', 'rating']),
  label: z.string().min(1),
  options: z.array(z.string()).optional().default([]),
  required: z.boolean().optional().default(false),
  order: z.number().int().default(0),
})

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(questionSchema).optional().default([]),
})

// ─── Helpers ───────────────────────────────────────────────

const ownsForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findFirst({ where: { id: formId, userId } })
  return form
}

// ─── Controllers ───────────────────────────────────────────

export const getForms = async (req: AuthRequest, res: Response) => {
  try {
    const forms = await prisma.form.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { responses: true, questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(forms)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const getForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })
    res.json(form)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, questions } = formSchema.parse(req.body)

    const form = await prisma.form.create({
      data: {
        title,
        description,
        userId: req.userId!,
        questions: {
          create: questions.map((q, i) => ({ ...q, order: q.order ?? i })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    res.status(201).json(form)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
    }).parse(req.body)

    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(description !== undefined && { description }) },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const deleteForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    await prisma.form.delete({ where: { id: req.params.id } })
    res.json({ message: 'Formulaire supprimé' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const toggleForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: { isOpen: !form.isOpen },
    })
    res.json({ isOpen: updated.isOpen })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const addQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const data = questionSchema.parse(req.body)

    // Si pas d'ordre fourni, met à la fin
    if (data.order === undefined || data.order === 0) {
      const last = await prisma.question.findFirst({
        where: { formId: req.params.id },
        orderBy: { order: 'desc' },
      })
      data.order = (last?.order ?? -1) + 1
    }

    const question = await prisma.question.create({
      data: { ...data, formId: req.params.id },
    })
    res.status(201).json(question)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const question = await prisma.question.findFirst({
      where: { id: req.params.qid, formId: req.params.id },
    })
    if (!question) return res.status(404).json({ message: 'Question introuvable' })

    const data = questionSchema.partial().parse(req.body)
    const updated = await prisma.question.update({
      where: { id: req.params.qid },
      data,
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    const question = await prisma.question.findFirst({
      where: { id: req.params.qid, formId: req.params.id },
    })
    if (!question) return res.status(404).json({ message: 'Question introuvable' })

    await prisma.question.delete({ where: { id: req.params.qid } })
    res.json({ message: 'Question supprimée' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

export const reorderQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const form = await ownsForm(req.params.id, req.userId!)
    if (!form) return res.status(404).json({ message: 'Formulaire introuvable' })

    // body: [{ id: "...", order: 0 }, { id: "...", order: 1 }, ...]
    const { questions } = z.object({
      questions: z.array(z.object({ id: z.string(), order: z.number().int() })),
    }).parse(req.body)

    await Promise.all(
      questions.map(q =>
        prisma.question.updateMany({
          where: { id: q.id, formId: req.params.id },
          data: { order: q.order },
        })
      )
    )
    res.json({ message: 'Ordre mis à jour' })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message })
    res.status(500).json({ message: 'Erreur serveur' })
  }
}