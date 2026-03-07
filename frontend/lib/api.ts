import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password })

// Forms
export const getForms = () => api.get('/forms')
export const getForm = (id: string) => api.get(`/forms/${id}`)
export const createForm = (data: unknown) => api.post('/forms', data)
export const updateForm = (id: string, data: unknown) => api.put(`/forms/${id}`, data)
export const deleteForm = (id: string) => api.delete(`/forms/${id}`)

// Réponses élèves (route publique)
export const getPublicForm = (token: string) => api.get(`/respond/${token}`)
export const submitResponse = (token: string, answers: unknown) =>
  api.post(`/respond/${token}`, { answers })

// Résultats + IA
export const getResults = (formId: string) => api.get(`/forms/${formId}/results`)
export const getAIInsights = (formId: string) => api.get(`/forms/${formId}/insights`)

export default api