'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Check,
  X,
  Star,
  Send,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { getPublicForm, submitResponse } from '@/lib/api'
import { Form, QuestionType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const answerSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    })
  ),
})

type AnswerFormData = z.infer<typeof answerSchema>

function YesNoInput({
  value,
  onChange,
}: {
  value: boolean | undefined
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium',
          value === true
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-muted bg-muted/50 hover:border-green-500/50'
        )}
      >
        <Check className="h-5 w-5" /> Oui
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium',
          value === false
            ? 'border-red-500 bg-red-500 text-white'
            : 'border-muted bg-muted/50 hover:border-red-500/50'
        )}
      >
        <X className="h-5 w-5" /> Non
      </button>
    </div>
  )
}

function RatingInput({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (value: number) => void
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'h-12 w-12 rounded-xl text-lg font-semibold transition-all duration-200',
            value === n
              ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function MultipleChoiceInput({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string | string[] | undefined
  onChange: (value: string) => void
}) {
  const selectedValue = Array.isArray(value) ? value[0] : value

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'w-full py-3 px-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3',
            selectedValue === option
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-muted bg-muted/50 hover:border-primary/50'
          )}
        >
          <div
            className={cn(
              'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
              selectedValue === option ? 'border-primary bg-primary' : 'border-muted-foreground'
            )}
          >
            {selectedValue === option && <Check className="h-3 w-3 text-white" />}
          </div>
          {option}
        </button>
      ))}
    </div>
  )
}

function OpenInput({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Écrivez votre réponse ici...'}
      rows={4}
      className="resize-none rounded-xl"
    />
  )
}

function QuestionCard({
  question,
  index,
  value,
  onChange,
}: {
  question: Form['questions'][0]
  index: number
  value: any
  onChange: (value: any) => void
}) {
  const renderInput = () => {
    switch (question.type) {
      case 'yes_no':
        return <YesNoInput value={value} onChange={onChange} />
      case 'rating':
        return <RatingInput value={value} onChange={onChange} />
      case 'multiple_choice':
        return (
          <MultipleChoiceInput
            options={question.options || []}
            value={value}
            onChange={onChange}
          />
        )
      case 'open':
        return <OpenInput value={value} onChange={onChange} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-base font-medium">
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </p>
        </div>
      </div>
      <div className="pl-11">{renderInput()}</div>
    </div>
  )
}

export default function RespondPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, setValue, watch } = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answers: [],
    },
  })

  const answers = watch('answers')

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await getPublicForm(resolvedParams.token)
        setForm(response.data)
        // Initialize answers array
        setValue(
          'answers',
          response.data.questions.map((q: Form['questions'][0]) => ({
            questionId: q.id,
            value: undefined,
          }))
        )
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('Ce formulaire est fermé et n\'accepte plus de réponses.')
        } else if (err.response?.status === 404) {
          setError('Ce formulaire n\'existe pas.')
        } else {
          setError('Erreur lors du chargement du formulaire.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchForm()
  }, [resolvedParams.token, setValue])

  const updateAnswer = (questionId: string, value: any) => {
    const currentAnswers = answers || []
    const newAnswers = currentAnswers.map((a) =>
      a.questionId === questionId ? { ...a, value } : a
    )
    setValue('answers', newAnswers)
  }

  const getAnswerValue = (questionId: string) => {
    return answers?.find((a) => a.questionId === questionId)?.value
  }

  const onSubmit = async (data: AnswerFormData) => {
    // Validate required questions
    if (form) {
      for (const question of form.questions) {
        if (question.required) {
          const answer = data.answers.find((a) => a.questionId === question.id)
          if (answer?.value === undefined || answer?.value === '' || answer?.value === null) {
            toast.error(`Veuillez répondre à la question "${question.label}"`)
            return
          }
        }
      }
    }

    setIsSubmitting(true)
    try {
      const validAnswers = data.answers.filter(a => a.questionId && a.value !== undefined) as { questionId: string; value: string | number | boolean | string[] }[]
      await submitResponse(resolvedParams.token, validAnswers)
      router.push(`/respond/${resolvedParams.token}/success`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement du formulaire...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="pt-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">{error}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Contactez votre enseignant pour plus d'informations.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!form) return null

  const sortedQuestions = [...form.questions].sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center py-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-4 shadow-lg shadow-primary/30">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {sortedQuestions.map((question, index) => (
            <Card key={question.id} className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <QuestionCard
                  question={question}
                  index={index}
                  value={getAnswerValue(question.id)}
                  onChange={(value) => updateAnswer(question.id, value)}
                />
              </CardContent>
            </Card>
          ))}

          {/* Submit button - fixed at bottom on mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t lg:static lg:bg-transparent lg:border-0 lg:backdrop-blur-none">
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" /> Envoyer mes réponses
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
