export type QuestionType = 'multiple_choice' | 'open' | 'yes_no' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  label: string
  options?: string[]
  required: boolean
  order: number
}

export interface Form {
  id: string
  title: string
  description?: string
  questions: Question[]
  token: string
  createdAt: string
  isOpen: boolean
  _count?: {
    responses: number
    questions: number
  }
}

export interface Answer {
  id?: string
  questionId: string
  value: string | number | boolean | string[]
  question?: {
    label: string
    type: QuestionType
  }
}

export interface Response {
  id: string
  formId: string
  submittedAt: string
  answers: Answer[]
}

export interface User {
  id: string
  email: string
  name: string
  createdAt?: string
}

// Analytics types
export interface ChartData {
  label: string
  count: number
  percentage: number
}

export interface QuestionAnalytics {
  questionId: string
  label: string
  type: QuestionType
  totalAnswers: number
  distribution?: Record<string, number>
  chart?: ChartData[]
  average?: number
  min?: number
  max?: number
  answers?: string[]
}

export interface Analytics {
  formId: string
  title: string
  totalResponses: number
  analytics: QuestionAnalytics[]
}

// AI Insights types
export interface ThemeInsight {
  theme: string
  count: number
  examples: string[]
}

export interface OpenAnswersSummary {
  questionLabel: string
  themes: ThemeInsight[]
  globalSentiment: string
}

export interface AIInsight {
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  openAnswersSummary?: OpenAnswersSummary[]
}

export interface QuestionInsight {
  questionLabel: string
  totalAnswers: number
  themes: ThemeInsight[]
  globalSentiment: string
  suggestion: string
  chart: ChartData[]
}

// API Response types
export interface ApiError {
  message: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface FormWithCount extends Form {
  _count: {
    responses: number
    questions: number
  }
}