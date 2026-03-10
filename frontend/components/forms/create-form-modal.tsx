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
  X,
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

const questionTypes: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: 'yes_no', label: 'Oui / Non', icon: CheckCircle },
  { value: 'multiple_choice', label: 'Choix multiple', icon: List },
  { value: 'rating', label: 'Note (1-5)', icon: Star },
  { value: 'open', label: 'Texte libre', icon: Type },
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
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMoveUp}
              disabled={!canMoveUp}
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
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
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
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Type selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Type de question</Label>
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
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Question label */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Question</Label>
        <Input
          placeholder="Entrez votre question..."
          className="h-10"
          {...register(`questions.${index}.label`)}
        />
      </div>

      {/* Options for multiple choice */}
      {type === 'multiple_choice' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Options de réponse</Label>
          <div className="space-y-2">
            {fields.map((field, optionIndex) => (
              <div key={field.id} className="flex items-center gap-2">
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
      <div className="flex items-center justify-between pt-2">
        <Label htmlFor={`required-${index}`} className="text-xs text-muted-foreground">
          Réponse obligatoire
        </Label>
        <Switch
          id={`required-${index}`}
          {...register(`questions.${index}.required`)}
          onCheckedChange={(checked) => setValue(`questions.${index}.required`, checked)}
        />
      </div>
    </div>
  )
}

export function CreateFormModal({ open, onOpenChange }: CreateFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      router.refresh()
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-xl">Créer un nouveau formulaire</DialogTitle>
          <DialogDescription>
            Créez un sondage pour collecter les retours de vos élèves
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Form info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Titre du formulaire
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
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted-foreground">(optionnelle)</span>
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
                <h3 className="text-sm font-semibold">Questions</h3>
                <Badge variant="secondary" className="text-xs">
                  {fields.length} question{fields.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {fields.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Ajoutez votre première question
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
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
              ) : (
                <>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
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
                    <p className="text-xs text-muted-foreground">Ajouter une question</p>
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
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
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
