'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Type,
  CheckCircle,
  Star,
  List,
  Loader2,
  Save,
  ArrowLeft,
} from 'lucide-react'
import { createForm } from '@/lib/api'
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
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type selector */}
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

        {/* Question label */}
        <div className="space-y-2">
          <Label>Question</Label>
          <Input
            placeholder="Entrez votre question..."
            {...register(`questions.${index}.label`)}
          />
        </div>

        {/* Options for multiple choice */}
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

        {/* Required toggle */}
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

export default function NewFormPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout title="Nouveau formulaire">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Nouveau formulaire</h1>
                <p className="text-sm text-muted-foreground">Créez un sondage pour vos élèves</p>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Enregistrer
                </>
              )}
            </Button>
          </div>

          {/* Form info */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du formulaire</Label>
                <Input
                  id="title"
                  placeholder="Ex: Évaluation du cours de mathématiques"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnelle)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le but de ce formulaire..."
                  rows={3}
                  {...register('description')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Questions</h2>
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
                  <p className="text-sm text-muted-foreground">Ajouter une question</p>
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
        </form>
      </div>
    </AdminLayout>
  )
}
