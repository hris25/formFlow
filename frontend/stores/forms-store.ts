import { create } from 'zustand'
import { Question, Form, Response, Analytics, AIInsight } from '@/types'

interface FormsState {
  forms: Form[]
  currentForm: Form | null
  responses: Response[]
  analytics: Analytics | null
  insights: AIInsight | null
  isLoading: boolean
  isSubmitting: boolean

  setForms: (forms: Form[]) => void
  addForm: (form: Form) => void
  updateForm: (id: string, data: Partial<Form>) => void
  removeForm: (id: string) => void
  setCurrentForm: (form: Form | null) => void
  setResponses: (responses: Response[]) => void
  setAnalytics: (analytics: Analytics | null) => void
  setInsights: (insights: AIInsight | null) => void
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void

  addQuestion: (question: Question) => void
  updateQuestion: (questionId: string, data: Partial<Question>) => void
  removeQuestion: (questionId: string) => void
  reorderQuestions: (questions: { id: string; order: number }[]) => void
}

export const useFormsStore = create<FormsState>((set) => ({
  forms: [],
  currentForm: null,
  responses: [],
  analytics: null,
  insights: null,
  isLoading: false,
  isSubmitting: false,

  setForms: (forms) => set({ forms }),

  addForm: (form) => set((state) => ({ forms: [form, ...state.forms] })),

  updateForm: (id, data) =>
    set((state) => ({
      forms: state.forms.map((f) => (f.id === id ? { ...f, ...data } : f)),
      currentForm:
        state.currentForm?.id === id
          ? { ...state.currentForm, ...data }
          : state.currentForm,
    })),

  removeForm: (id) =>
    set((state) => ({
      forms: state.forms.filter((f) => f.id !== id),
      currentForm: state.currentForm?.id === id ? null : state.currentForm,
    })),

  setCurrentForm: (form) => set({ currentForm: form }),

  setResponses: (responses) => set({ responses }),

  setAnalytics: (analytics) => set({ analytics }),

  setInsights: (insights) => set({ insights }),

  setLoading: (isLoading) => set({ isLoading }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  addQuestion: (question) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          questions: [...state.currentForm.questions, question],
        },
      }
    }),

  updateQuestion: (questionId, data) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          questions: state.currentForm.questions.map((q) =>
            q.id === questionId ? { ...q, ...data } : q
          ),
        },
      }
    }),

  removeQuestion: (questionId) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          questions: state.currentForm.questions.filter(
            (q) => q.id !== questionId
          ),
        },
      }
    }),

  reorderQuestions: (questions) =>
    set((state) => {
      if (!state.currentForm) return state
      const questionMap = new Map(questions.map((q) => [q.id, q.order]))
      return {
        currentForm: {
          ...state.currentForm,
          questions: state.currentForm.questions
            .map((q) => ({
              ...q,
              order: questionMap.get(q.id) ?? q.order,
            }))
            .sort((a, b) => a.order - b.order),
        },
      }
    }),
}))
