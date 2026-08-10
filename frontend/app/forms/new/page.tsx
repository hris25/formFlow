'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Type,
  CheckCircle,
  Star,
  List,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Users,
  PartyPopper,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createForm } from '@/lib/api'
import { templates, templateQuestions, type Template } from '@/lib/templates'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuestionType } from '@/types'

const questionTypes: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: 'yes_no', label: 'Oui / Non', icon: CheckCircle },
  { value: 'multiple_choice', label: 'Choix multiple', icon: List },
  { value: 'rating', label: 'Note (1-5)', icon: Star },
  { value: 'open', label: 'Texte libre', icon: Type },
]

const questionTypeLabels: Record<string, string> = {
  yes_no: 'Oui / Non',
  multiple_choice: 'Choix multiple',
  rating: 'Note (1-5)',
  open: 'Texte libre',
}

const formSchema = z.object({
  title: z.string().min(3, 'Titre minimum 3 caractères'),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      type: z.enum(['yes_no', 'multiple_choice', 'rating', 'open']),
      label: z.string().min(3, 'Question minimum 3 caractères'),
      options: z.array(z.string()).optional(),
      required: z.boolean(),
      order: z.number(),
    })
  ),
})

type FormData = z.infer<typeof formSchema>

const STEP_LABELS = ['Titre', 'Questions', 'Résumé']

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label="Étapes de création">
      {STEP_LABELS.map((label, index) => {
        const n = index + 1
        const isDone = step > n
        const isActive = step === n
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            {index > 0 && <div className={cn('h-px w-6 sm:w-12', isDone ? 'bg-primary' : 'bg-border')} />}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all shrink-0',
                  isActive && 'bg-primary text-primary-foreground shadow-md shadow-primary/30',
                  isDone && 'bg-green-500/15 text-green-600 dark:text-green-400',
                  !isActive && !isDone && 'bg-muted text-muted-foreground'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span className={cn(
                'hidden sm:block text-xs font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuestionEditor({
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  control,
  register,
  watch,
  setValue,
}: {
  index: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  control: any
  register: any
  watch: any
  setValue: any
}) {
  const { fields, append, remove } = useFieldArray({
    name: `questions.${index}.options`,
    control,
  })
  const type = watch(`questions.${index}.type`) as QuestionType

  const TypeIcon = questionTypes.find((t) => t.value === type)?.icon || Type

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                aria-label="Monter la question"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                aria-label="Descendre la question"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <Badge variant="secondary" className="font-mono">
              Q{index + 1}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TypeIcon className="h-4 w-4" />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9"
            onClick={onRemove}
            aria-label="Supprimer la question"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type de question</Label>
          <Select
            value={type}
            onValueChange={(value: QuestionType) => {
              setValue(`questions.${index}.type`, value)
              if (value === 'multiple_choice') {
                setValue(`questions.${index}.options`, ['Option 1', 'Option 2'])
              } else {
                setValue(`questions.${index}.options`, undefined)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un type" />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`q-label-${index}`}>Question</Label>
          <Input
            id={`q-label-${index}`}
            placeholder="Entrez votre question..."
            {...register(`questions.${index}.label`)}
          />
        </div>

        {type === 'multiple_choice' && (
          <div className="space-y-2">
            <Label>Options de réponse</Label>
            <div className="space-y-2">
              {fields.map((field, optionIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    {...register(`questions.${index}.options.${optionIndex}` as const)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => remove(optionIndex)}
                    disabled={fields.length <= 2}
                    aria-label="Supprimer cette option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => append(`Option ${fields.length + 1}`)}
            >
              <Plus className="h-4 w-4 mr-2" /> Ajouter une option
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor={`required-${index}`}>Réponse obligatoire</Label>
          <Switch
            id={`required-${index}`}
            {...register(`questions.${index}.required`)}
            onCheckedChange={(checked) => setValue(`questions.${index}.required`, checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SuccessScreen({ formId, title, onDone }: { formId: string; title: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/respond/${formId}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Lien copié ! Vous pouvez le partager avec vos élèves')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
          <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Votre formulaire est prêt !</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          « {title} » a été créé. Il suffit maintenant de le partager pour commencer à
          recevoir les réponses de vos élèves.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-2xl shadow-inner">
              <QRCodeSVG value={link} size={170} level="H" className="max-w-full h-auto" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Vos élèves peuvent scanner ce code avec leur téléphone
            </p>
          </div>

          <div className="flex gap-2">
            <Input value={link} readOnly className="bg-muted/50 font-mono text-xs" />
            <Button
              variant={copied ? 'default' : 'outline'}
              onClick={copyLink}
              className={cn('shrink-0 min-w-[110px]', copied && 'bg-green-500 hover:bg-green-500')}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" /> Ouvrir le formulaire
            </a>
            <a
              href={`/forms/${formId}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="h-4 w-4" /> Voir le formulaire
              </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onDone}>
          Créer un autre formulaire
        </Button>
      </div>
    </div>
  )
}

export default function NewFormPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdTitle, setCreatedTitle] = useState('')

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      questions: [],
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  })

  const watchedQuestions = watch('questions')
  const titleValue = watch('title')

  const allQuestionsValid = watchedQuestions.length > 0 &&
    watchedQuestions.every((q) => (q.label?.trim()?.length ?? 0) >= 3)

  const applyTemplate = (tpl: Template) => {
    if (tpl.id === 'scratch') {
      setValue('title', '')
      setValue('description', '')
      setValue('questions', [])
      setAppliedTemplate(null)
      toast.info('Partez de zéro — décrivez votre sondage')
      return
    }
    const questions = (templateQuestions[tpl.id] || []).map((q, i) => ({
      type: q.type,
      label: q.label,
      options: q.type === 'multiple_choice' ? (q.options || []) : undefined,
      required: q.required,
      order: i,
    }))
    setValue('title', tpl.title || '')
    setValue('description', tpl.formDescription || '')
    setValue('questions', questions)
    setAppliedTemplate(tpl.id)
    toast.success(`Modèle « ${tpl.name} » appliqué — vous pouvez le modifier`)
  }

  const addQuestion = (type: QuestionType) => {
    append({
      type,
      label: '',
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : undefined,
      required: true,
      order: fields.length,
    })
  }

  const goNext = () => {
    if (step === 1 && (titleValue.trim()?.length ?? 0) < 3) {
      toast.error('Donnez un titre à votre formulaire (3 caractères minimum)')
      return
    }
    if (step === 2) {
      if (watchedQuestions.length === 0) {
        toast.error('Ajoutez au moins une question')
        return
      }
      if (!allQuestionsValid) {
        toast.error('Certaines questions n\'ont pas encore de texte (3 caractères minimum)')
        return
      }
    }
    setStep((s) => Math.min(3, s + 1))
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const questions = data.questions.map((q, index) => ({
        type: q.type,
        label: q.label,
        options: q.options,
        required: q.required,
        order: index,
      }))

      const response = await createForm({
        title: data.title,
        description: data.description,
        questions,
      })
      setCreatedId(response.data.id)
      setCreatedTitle(response.data.title)
      toast.success('Formulaire créé avec succès !')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdId) {
    return (
      <AdminLayout title="Formulaire créé">
        <div className="max-w-2xl mx-auto">
          <SuccessScreen formId={createdId} title={createdTitle} onDone={() => {
            setCreatedId(null)
            setCreatedTitle('')
            setStep(1)
            setValue('title', '')
            setValue('description', '')
            setValue('questions', [])
          }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Nouveau formulaire">
      <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
        {/* Stepper header */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Stepper step={step} />
          <div className="w-10" />
        </div>

        {/* Step 1 — Titre */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Commencer un sondage</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choisissez un modèle pour gagner du temps, ou partez de zéro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tpl) => {
                const Icon = tpl.icon
                const isSelected = appliedTemplate === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md hover:-translate-y-0.5',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                      isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {tpl.name}
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Titre du formulaire <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex : Évaluation du cours de mathématiques"
                  className="h-11"
                  {...register('title')}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optionnelle)</span></Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le but de ce formulaire, vos élèves verront ce texte..."
                  rows={3}
                  {...register('description')}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={goNext} className="gap-2" size="lg">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Questions */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Les questions</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez les questions que vos élèves devront répondre.
                </p>
              </div>
              <Badge variant="secondary">{fields.length} question{fields.length > 1 ? 's' : ''}</Badge>
            </div>

            {fields.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Ajoutez votre première question</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {questionTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant="outline"
                          onClick={() => addQuestion(type.value)}
                        >
                          <type.icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <QuestionEditor
                      key={field.id}
                      index={index}
                      onRemove={() => remove(index)}
                      onMoveUp={() => index > 0 && move(index, index - 1)}
                      onMoveDown={() => index < fields.length - 1 && move(index, index + 1)}
                      canMoveUp={index > 0}
                      canMoveDown={index < fields.length - 1}
                      control={control}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                    />
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Ajouter une autre question</p>
                  <div className="flex flex-wrap gap-2">
                    {questionTypes.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(type.value)}
                      >
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {!allQuestionsValid && (
                  <p className="text-sm text-muted-foreground">
                    Vos questions doivent avoir au moins 3 caractères pour être enregistrées.
                  </p>
                )}
              </>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button type="button" onClick={goNext} className="gap-3" size="lg">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Résumé + création */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Tout est prêt !</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vérifiez votre sondage avant de le publier.
              </p>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Titre</p>
                  <p className="font-semibold text-foreground">{titleValue}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              {watchedQuestions.map((q, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <Badge variant="secondary" className="font-mono shrink-0 mt-0.5">Q{index + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{q.label}</p>
                    {q.type === 'multiple_choice' && q.options?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {q.options.join(' · ')}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">{questionTypeLabels[q.type]}</Badge>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <Button type="button" variant="ghost" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Modifier les questions
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !allQuestionsValid}
                className="gap-2"
                size="lg"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSubmitting ? 'Création en cours…' : 'Créer mon formulaire'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}