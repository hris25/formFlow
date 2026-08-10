import { PenLine, GraduationCap, Zap, BookOpenCheck } from 'lucide-react'
import { QuestionType } from '@/types'

export interface TemplateQuestion {
  type: QuestionType
  label: string
  options?: string[]
  required: boolean
}

export interface Template {
  id: string
  name: string
  description: string
  icon: React.ElementType
  title?: string
  formDescription?: string
}

export const templates: Template[] = [
  { id: 'scratch', name: 'Partir de zéro', description: 'Créez votre propre sondage', icon: PenLine },
  {
    id: 'course',
    name: 'Évaluation de cours',
    description: 'Recueillez les retours sur un cours ou une séance',
    icon: GraduationCap,
    title: 'Évaluation du cours',
    formDescription: 'Merci de donner votre avis sur ce cours, vos réponses restent anonymes.',
  },
  {
    id: 'quick',
    name: 'Sondage rapide',
    description: 'Une vérification rapide en 1 minute',
    icon: Zap,
    title: 'Sondage rapide',
    formDescription: 'Répondez simplement et honnêtement, cela prend moins d\'une minute.',
  },
  {
    id: 'check',
    name: 'Compréhension de la leçon',
    description: 'Vérifiez que tout le monde a compris',
    icon: BookOpenCheck,
    title: 'Avez-vous compris la leçon ?',
    formDescription: 'Ce petit sondage m\'aide à savoir si je dois réexpliquer certaines notions.',
  },
]

export const templateQuestions: Record<string, TemplateQuestion[]> = {
  course: [
    { type: 'rating', label: 'Comment évaluez-vous ce cours dans l\'ensemble ?', required: true },
    { type: 'yes_no', label: 'Les objectifs du cours étaient-ils clairs ?', required: true },
    { type: 'open', label: 'Qu\'avez-vous le plus apprécié ?', required: false },
    { type: 'open', label: 'Qu\'est-ce qui pourrait être amélioré ?', required: false },
  ],
  quick: [
    { type: 'yes_no', label: 'Avez-vous compris la leçon d\'aujourd\'hui ?', required: true },
    { type: 'rating', label: 'Niveau de confiance dans la matière', required: true },
    { type: 'open', label: 'Une question à poser (optionnel)', required: false },
  ],
  check: [
    { type: 'multiple_choice', label: 'Quelle partie de la leçon vous semble la plus difficile ?', options: ['Les exercices', 'Le cours magistral', 'Les devoirs à la maison', 'Rien de particulier'], required: true },
    { type: 'yes_no', label: 'Aimeriez-vous une séance de révision ?', required: true },
    { type: 'open', label: 'Dites-moi ce qui bloque, en quelques mots', required: false },
  ],
}

export const buildDemoForm = () => {
  const course = templates.find((t) => t.id === 'course')!
  const questions = templateQuestions.course.map((q, i) => ({
    type: q.type,
    label: q.label,
    options: q.options,
    required: q.required,
    order: i,
  }))
  return {
    title: `${course.title} (exemple)`,
    description: course.description,
    questions,
  }
}