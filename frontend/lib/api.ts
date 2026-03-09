import axios, { AxiosError } from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============ AUTH ============

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password })

export const getProfile = () => api.get('/auth/me')

export const updateProfile = (data: { name?: string; email?: string }) =>
  api.put('/auth/me', data)

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put('/auth/password', { currentPassword, newPassword })

export const logout = () => api.post('/auth/logout')

// ============ FORMS ============

export const getForms = () => api.get('/forms')

export const getForm = (id: string) => api.get(`/forms/${id}`)

export const createForm = (data: {
  title: string
  description?: string
  questions?: Array<{
    type: 'yes_no' | 'multiple_choice' | 'rating' | 'open'
    label: string
    options?: string[]
    required: boolean
    order: number
  }>
}) => api.post('/forms', data)

export const updateForm = (
  id: string,
  data: { title?: string; description?: string }
) => api.put(`/forms/${id}`, data)

export const toggleForm = (id: string) => api.patch(`/forms/${id}/toggle`)

export const deleteForm = (id: string) => api.delete(`/forms/${id}`)

// ============ QUESTIONS ============

export const addQuestion = (
  formId: string,
  data: {
    type: 'yes_no' | 'multiple_choice' | 'rating' | 'open'
    label: string
    options?: string[]
    required: boolean
  }
) => api.post(`/forms/${formId}/questions`, data)

export const updateQuestion = (
  formId: string,
  questionId: string,
  data: { label?: string; options?: string[]; required?: boolean }
) => api.put(`/forms/${formId}/questions/${questionId}`, data)

export const reorderQuestions = (
  formId: string,
  questions: Array<{ id: string; order: number }>
) => api.put(`/forms/${formId}/questions/reorder`, { questions })

export const deleteQuestion = (formId: string, questionId: string) =>
  api.delete(`/forms/${formId}/questions/${questionId}`)

// ============ PUBLIC (élèves) ============

export const getPublicForm = (token: string) => api.get(`/respond/${token}`)

export const submitResponse = (
  token: string,
  answers: Array<{ questionId: string; value: string | number | boolean | string[] }>
) => api.post(`/respond/${token}`, { answers })

// ============ RESPONSES ============

export const getResponses = (formId: string) =>
  api.get(`/forms/${formId}/responses`)

export const getResponse = (formId: string, responseId: string) =>
  api.get(`/forms/${formId}/responses/${responseId}`)

export const deleteResponse = (formId: string, responseId: string) =>
  api.delete(`/forms/${formId}/responses/${responseId}`)

// ============ ANALYTICS ============

export const getAnalytics = (formId: string) =>
  api.get(`/forms/${formId}/analytics`)

export const getQuestionAnalytics = (formId: string, questionId: string) =>
  api.get(`/forms/${formId}/analytics/${questionId}`)

// ============ AI INSIGHTS ============

export const getInsights = (formId: string) =>
  api.get(`/forms/${formId}/insights`)

export const getQuestionInsights = (formId: string, questionId: string) =>
  api.get(`/forms/${formId}/insights/${questionId}`)

export default api