import { create } from 'zustand'
import { Form } from '@/types'

interface FormsState {
  forms: Form[]
  isLoading: boolean

  setForms: (forms: Form[]) => void
  setLoading: (loading: boolean) => void
}

export const useFormsStore = create<FormsState>((set) => ({
  forms: [],
  isLoading: false,

  setForms: (forms) => set({ forms }),

  setLoading: (isLoading) => set({ isLoading }),
}))