'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
  Save,
  ArrowLeft,
  Check,
} from 'lucide-react'
import { getForm, updateForm, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } from '@/lib/api'
import { Form, QuestionType } from '@/types'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const questionTypes: { value: QuestionType; label: string; icon: React.ElementType }[] = [
  { value: 'yes_no', label: 'Oui / Non', icon: CheckCircle },
  { value: 'multiple_choice', label: 'Choix multiple', icon: List },
  { value: 'rating', label: 'Note (1-5)', icon: Star },
  { value: 'open', label: 'Texte libre', icon: Type },
]

const formInfoSchema = z.object({
  title: z.string().min(3, 'Titre minimum 3 caractères'),
  description: z.string().optional(),
})

type FormInfoData = z.infer<typeof formInfoSchema>

interface EditableQuestion {
  id?: string
  type: QuestionType
  label: string
  options?: string[]
  required: boolean
  order: number
  isDirty?: boolean
}

export default function EditFormPage() {
  const resolvedParams = useParams() as { id: string }
  const router = useRouter()
  const [form, setForm] = useState<Form | null>(null)
  const [questions, setQuestions] = useState<EditableQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)
  const [initialOrderKey, setInitialOrderKey] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty: formInfoDirty },
  } = useForm<FormInfoData>({
    resolver: zodResolver(formInfoSchema),
  })

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await getForm(resolvedParams.id)
        const formData = response.data
        setForm(formData)
        const sorted = formData.questions
          .sort((a: any, b: any) => a.order - b.order)
          .map((q: any) => ({ ...q, isDirty: false }))
        setQuestions(sorted)
        setInitialOrderKey(sorted.map((q: any) => q.id).join('|'))
        reset({
          title: formData.title,
          description: formData.description || '',
        })
      } catch (error) {
        toast.error('Erreur lors du chargement')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchForm()
  }, [resolvedParams.id, router, reset])

  const questionsDirty = questions.some((q) => q.isDirty)
  const orderChanged = questions.map((q) => q.id).join('|') !== initialOrderKey
  const hasChanges = formInfoDirty || questionsDirty || orderChanged

  const saveAll = async () => {
    if (!form) return
    if (!hasChanges) return

    const invalidLabel = questions.find((q) => q.isDirty && (q.label?.trim()?.length ?? 0) < 3)
    if (invalidLabel) {
      toast.error('Une question modifiée n\'a pas encore de texte (3 caractères minimum)')
      return
    }

    setIsSaving(true)
    const failures: string[] = []

    // 1. Informations générales
    const info = await new Promise<FormInfoData | null>((resolve) => {
      handleSubmit((data) => resolve(data), () => resolve(null))()
    })
    if (info) {
      try {
        await updateForm(form.id, { title: info.title, description: info.description })
        setForm({ ...form, title: info.title, description: info.description })
      } catch {
        failures.push('les informations')
      }
    }

    // 2. Questions modifiées
    const dirtyQuestions = questions.filter((q) => q.isDirty && q.id)
    for (const q of dirtyQuestions) {
      try {
        await updateQuestion(form.id, q.id!, {
          label: q.label,
          options: q.options,
          required: q.required,
        })
      } catch {
        failures.push(`la question « ${q.label || 'sans titre'} »`)
      }
    }

    // 3. Ordre des questions
    if (orderChanged && questions.every((q) => q.id)) {
      try {
        await reorderQuestions(
          form.id,
          questions.map((q, i) => ({ id: q.id!, order: i }))
        )
      } catch {
        failures.push('l\'ordre des questions')
      }
    }

    if (failures.length === 0) {
      setQuestions(questions.map((q) => ({ ...q, isDirty: false })))
      setInitialOrderKey(questions.map((q) => q.id).join('|'))
      reset({
        title: form.title,
        description: form.description,
      })
      toast.success('Modifications enregistrées')
    } else {
      toast.error(`Impossible d\'enregistrer : ${failures.join(', ')}. Réessayez.`)
    }
    setIsSaving(false)
  }

  const handleAddQuestion = async (type: QuestionType) => {
    if (!form) return
    const newOrder = questions.length
    try {
      const response = await addQuestion(form.id, {
        type,
        label: `Nouvelle question ${newOrder + 1}`,
        options: type === 'multiple_choice' ? ['Option 1', 'Option 2'] : undefined,
        required: true,
      })
      const created = { ...response.data, isDirty: false }
      setQuestions([...questions, created])
      setInitialOrderKey([...questions.map((q) => q.id), created.id].join('|'))
      toast.success('Question ajoutée — pensez à enregistrer')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  const handleDeleteQuestion = async () => {
    if (!form || questionToDelete === null) return
    const q = questions[questionToDelete]
    if (!q.id) {
      setQuestionToDelete(null)
      return
    }
    try {
      await deleteQuestion(form.id, q.id)
      const remaining = questions.filter((_, i) => i !== questionToDelete)
      setQuestions(remaining)
      setInitialOrderKey(remaining.map((qq) => qq.id).join('|'))
      toast.success('Question supprimée')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    } finally {
      setQuestionToDelete(null)
    }
  }

  const handleMoveQuestion = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= questions.length) return

    const next = [...questions]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    const reordered = next.map((q, i) => ({ ...q, order: i }))
    setQuestions(reordered)
    // L'ancien ordre est restauré automatiquement si l'enregistrement échoue
  }

  const updateLocalQuestion = (index: number, data: Partial<EditableQuestion>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...data, isDirty: true }
    setQuestions(updated)
  }

  if (isLoading) {
    return (
      <AdminLayout title="Modifier le formulaire">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    )
  }

  if (!form) return null

  return (
    <AdminLayout title={`Modifier — ${form.title}`}>
      <div className="max-w-3xl mx-auto space-y-6 pb-24 lg:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/forms/${form.id}`)} aria-label="Retour au formulaire">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">Modifier le formulaire</h1>
              <p className="text-sm text-muted-foreground">
                Vos modifications sont enregistrées quand vous cliquez sur « Enregistrer »
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={saveAll}
            disabled={!hasChanges || isSaving}
            className="gap-2 shrink-0"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasChanges ? (
              <Save className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isSaving ? 'Enregistrement…' : hasChanges ? 'Enregistrer' : 'À jour'}</span>
          </Button>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
            <span className="font-medium">Modifications non enregistrées</span>
            <span className="text-xs opacity-80 hidden sm:inline">— cliquez sur « Enregistrer » pour les appliquer à votre sondage</span>
          </div>
        )}

        {/* Form info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du formulaire</Label>
              <Input
                id="title"
                placeholder="Ex: Évaluation du cours"
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
            <h2 className="text-lg font-semibold text-foreground">Questions</h2>
            <Badge variant="secondary">{questions.length} question{questions.length > 1 ? 's' : ''}</Badge>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const TypeIcon = questionTypes.find((t) => t.value === question.type)?.icon || Type
              return (
                <Card key={question.id || index} className={cn('border-0 shadow-sm', question.isDirty && 'ring-2 ring-amber-500/40')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            aria-label="Monter la question"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === questions.length - 1}
                            aria-label="Descendre la question"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Badge variant="secondary" className="font-mono">Q{index + 1}</Badge>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        {question.isDirty && (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">
                            Modifié
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setQuestionToDelete(index)}
                        aria-label="Supprimer la question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`q-${question.id}`}>Question</Label>
                      <Input
                        id={`q-${question.id}`}
                        value={question.label}
                        onChange={(e) => updateLocalQuestion(index, { label: e.target.value })}
                        placeholder="Entrez votre question..."
                      />
                    </div>

                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <Label>Options de réponse</Label>
                        <div className="space-y-2">
                          {(question.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(question.options || [])]
                                  newOptions[optIdx] = e.target.value
                                  updateLocalQuestion(index, { options: newOptions })
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => {
                                  const newOptions = question.options?.filter((_, i) => i !== optIdx)
                                  updateLocalQuestion(index, { options: newOptions })
                                }}
                                disabled={(question.options?.length || 0) <= 2}
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
                          onClick={() => {
                            const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
                            updateLocalQuestion(index, { options: newOptions })
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Ajouter une option
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`required-${index}`}>Réponse obligatoire</Label>
                      <Switch
                        id={`required-${index}`}
                        checked={question.required}
                        onCheckedChange={(checked) => updateLocalQuestion(index, { required: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
                  onClick={() => handleAddQuestion(type.value)}
                >
                  <type.icon className="h-4 w-4 mr-2" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 inset-x-0 lg:hidden p-3 bg-background/95 backdrop-blur border-t z-40">
          <Button type="button" onClick={saveAll} disabled={isSaving} className="w-full gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={questionToDelete !== null} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette question ?</DialogTitle>
            <DialogDescription>
              Les réponses données à cette question seront également supprimées. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQuestionToDelete(null)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteQuestion}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}