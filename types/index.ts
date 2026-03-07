export type QuestionType = 'multiple_choice' | 'open' | 'yes_no' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  label: string
  options?: string[]     // pour multiple_choice
  required: boolean
  order: number
}

export interface Form {
  id: string
  title: string
  description?: string
  questions: Question[]
  token: string          // lien unique pour les élèves
  createdAt: string
  isOpen: boolean
}

export interface Answer {
  questionId: string
  value: string | string[]
}

export interface Response {
  id: string
  formId: string
  answers: Answer[]
  submittedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'teacher'
}

export interface AIInsight {
  summary: string
  suggestions: string[]
  trends: string[]
}