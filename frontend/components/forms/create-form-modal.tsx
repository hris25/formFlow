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
  CheckCircle2,
  Star,
  List,
  Loader2,
  Sparkles,
  PenLine,
  Edit3,
} from 'lucide-react'
import { createForm } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { QuestionType } from '@/types'

const questionTypes: { value: QuestionType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'yes_no', label: 'Oui / Non', icon: CheckCircle, color: 'text-green-500 dark:text-green-400' },
  { value: 'multiple_choice', label: 'Choix multiple', icon: List, color: 'text-blue-500 dark:text-blue-400' },
  { value: 'rating', label: 'Note (1-5)', icon: Star, color: 'text-amber-500 dark:text-amber-400' },
  { value: 'open', label: 'Texte libre', icon: Type, color: 'text-purple-500 dark:text-purple-400' },
]

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

interface CreateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Confirmed question compact card
function ConfirmedQuestion({
  index,
  label,
  type,
  onEdit,
  onRemove,
}: {
  index: number
  label: string
  type: QuestionType
  onEdit: () => void
  onRemove: () => void
}) {
  const typeInfo = questionTypes.find((t) => t.value === type)
  const Icon = typeInfo?.icon || Type

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/30 transition-all hover:shadow-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 dark:bg-green-500/20 shrink-0">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
        Q{index + 1}
      </Badge>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', typeInfo?.color)} />
        <span className="text-sm font-medium truncate text-foreground">{label || 'Sans titre'}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
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
  onConfirm,
  isNew,
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
  onConfirm: () => void
  isNew: boolean
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
  const label = watch(`questions.${index}.label`) as string

  const typeInfo = questionTypes.find((t) => t.value === type)
  const TypeIcon = typeInfo?.icon || Type

  return (
    <div className={cn(
      'rounded-2xl border-2 transition-all overflow-hidden',
      isNew
        ? 'border-primary/40 dark:border-primary/50 shadow-md shadow-primary/5'
        : 'border-border/50'
    )}>
      {/* New question banner */}
      {isNew && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">
            Nouvelle question #{index + 1}
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-5 bg-card">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={!canMoveUp}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={!canMoveDown}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              Q{index + 1}
            </Badge>
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20', typeInfo?.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Type selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Type de question</Label>
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
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choisir un type" />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon className={cn('h-4 w-4', t.color)} />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question label */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Votre question</Label>
          <Input
            placeholder="Ex: Comment évaluez-vous ce cours ?"
            className="h-11"
            {...register(`questions.${index}.label`)}
          />
        </div>

        {/* Options for multiple choice */}
        {type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Options de réponse</Label>
            <div className="space-y-2">
              {fields.map((field, optionIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    className="h-9"
                    {...register(`questions.${index}.options.${optionIndex}` as const)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => remove(optionIndex)}
                    disabled={fields.length <= 2}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9"
              onClick={() => append(`Option ${fields.length + 1}`)}
            >
              <Plus className="h-3.5 w-3.5 mr-2" /> Ajouter une option
            </Button>
          </div>
        )}

        {/* Required toggle */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <Label htmlFor={`required-${index}`} className="text-xs font-medium text-muted-foreground">
            Réponse obligatoire
          </Label>
          <Switch
            id={`required-${index}`}
            {...register(`questions.${index}.required`)}
            onCheckedChange={(checked) => setValue(`questions.${index}.required`, checked)}
          />
        </div>

        {/* Confirm button */}
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full h-10 gap-2 font-medium transition-all',
            label?.length >= 3
              ? 'border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:border-green-500/50'
              : 'opacity-60'
          )}
          disabled={!label || label.length < 3}
          onClick={onConfirm}
        >
          <CheckCircle2 className="h-4 w-4" />
          Confirmer cette question
        </Button>
      </div>
    </div>
  )
}

export function CreateFormModal({ open, onOpenChange }: CreateFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<number>>(new Set())

  const {
    register,
    control,
    handleSubmit,
    reset,
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

  const addQuestion = (type: QuestionType) => {
    append({
      type,
      label: '',
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : undefined,
      required: true,
      order: fields.length,
    })
  }

  const confirmQuestion = (index: number) => {
    setConfirmedQuestions((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
    toast.success(`Question ${index + 1} confirmée !`)
  }

  const editConfirmedQuestion = (index: number) => {
    setConfirmedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  const removeQuestion = (index: number) => {
    remove(index)
    // Recompute confirmed indices
    setConfirmedQuestions((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const onSubmit = async (data: FormData) => {
    if (data.questions.length === 0) {
      toast.error('Ajoutez au moins une question')
      return
    }

    setIsSubmitting(true)
    try {
      const questions = data.questions.map((q, index) => ({
        type: q.type,
        label: q.label,
        options: q.options,
        required: q.required,
        order: index,
      }))

      await createForm({
        title: data.title,
        description: data.description,
        questions,
      })
      toast.success('Formulaire créé avec succès !')
      onOpenChange(false)
      reset()
      setConfirmedQuestions(new Set())
      router.refresh()
      // Reload to update the forms list
      window.location.reload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      reset()
      setConfirmedQuestions(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-5 sm:px-6 py-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
              <PenLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl text-foreground">Créer un formulaire</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Créez un sondage pour collecter des retours
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 scrollbar-thin">
            {/* Form info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-foreground">
                  Titre du formulaire *
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Évaluation du cours de mathématiques"
                  className="h-11"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description <span className="text-muted-foreground font-normal">(optionnelle)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le but de ce formulaire..."
                  rows={2}
                  className="resize-none"
                  {...register('description')}
                />
              </div>
            </div>

            <Separator />

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Questions</h3>
                <Badge variant="secondary" className="text-xs">
                  {fields.length} question{fields.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {fields.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Aucune question ajoutée
                  </p>
                  <p className="text-xs text-muted-foreground mb-5">
                    Choisissez un type pour ajouter votre première question
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 px-4">
                    {questionTypes.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => addQuestion(type.value)}
                      >
                        <type.icon className={cn('h-4 w-4', type.color)} />
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const isConfirmed = confirmedQuestions.has(index)
                      const type = watch(`questions.${index}.type`) as QuestionType
                      const label = watch(`questions.${index}.label`) as string

                      if (isConfirmed) {
                        return (
                          <ConfirmedQuestion
                            key={field.id}
                            index={index}
                            label={label}
                            type={type}
                            onEdit={() => editConfirmedQuestion(index)}
                            onRemove={() => removeQuestion(index)}
                          />
                        )
                      }

                      return (
                        <QuestionEditor
                          key={field.id}
                          index={index}
                          onRemove={() => removeQuestion(index)}
                          onMoveUp={() => {
                            if (index > 0) {
                              move(index, index - 1)
                              // Update confirmed indices
                              setConfirmedQuestions((prev) => {
                                const next = new Set<number>()
                                prev.forEach((i) => {
                                  if (i === index) next.add(index - 1)
                                  else if (i === index - 1) next.add(index)
                                  else next.add(i)
                                })
                                return next
                              })
                            }
                          }}
                          onMoveDown={() => {
                            if (index < fields.length - 1) {
                              move(index, index + 1)
                              setConfirmedQuestions((prev) => {
                                const next = new Set<number>()
                                prev.forEach((i) => {
                                  if (i === index) next.add(index + 1)
                                  else if (i === index + 1) next.add(index)
                                  else next.add(i)
                                })
                                return next
                              })
                            }
                          }}
                          canMoveUp={index > 0}
                          canMoveDown={index < fields.length - 1}
                          onConfirm={() => confirmQuestion(index)}
                          isNew={!isConfirmed && index === fields.length - 1}
                          control={control}
                          register={register}
                          watch={watch}
                          setValue={setValue}
                        />
                      )
                    })}
                  </div>

                  <Separator />

                  {/* Add question section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">Ajouter une nouvelle question</p>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {questionTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 h-9"
                          onClick={() => addQuestion(type.value)}
                        >
                          <type.icon className={cn('h-4 w-4', type.color)} />
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le formulaire
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
