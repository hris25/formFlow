'use client'

import { useEffect, useState, use } from 'react'
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
    Save,
    ArrowLeft,
    GripVertical,
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
    isNew?: boolean
    isDirty?: boolean
}

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [form, setForm] = useState<Form | null>(null)
    const [questions, setQuestions] = useState<EditableQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormInfoData>({
        resolver: zodResolver(formInfoSchema),
    })

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await getForm(resolvedParams.id)
                const formData = response.data
                setForm(formData)
                setQuestions(
                    formData.questions
                        .sort((a: any, b: any) => a.order - b.order)
                        .map((q: any) => ({ ...q, isNew: false, isDirty: false }))
                )
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

    const saveFormInfo = async (data: FormInfoData) => {
        if (!form) return
        setIsSaving(true)
        try {
            await updateForm(form.id, {
                title: data.title,
                description: data.description,
            })
            setForm({ ...form, title: data.title, description: data.description })
            toast.success('Informations mises à jour')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setIsSaving(false)
        }
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
            setQuestions([...questions, { ...response.data, order: newOrder, isNew: false, isDirty: false }])
            toast.success('Question ajoutée')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur')
        }
    }

    const handleUpdateQuestion = async (index: number) => {
        if (!form) return
        const q = questions[index]
        if (!q.id) return

        setSavingQuestionId(q.id)
        try {
            await updateQuestion(form.id, q.id, {
                label: q.label,
                options: q.options,
                required: q.required,
            })
            const updated = [...questions]
            updated[index] = { ...updated[index], isDirty: false }
            setQuestions(updated)
            toast.success('Question mise à jour')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur')
        } finally {
            setSavingQuestionId(null)
        }
    }

    const handleDeleteQuestion = async (index: number) => {
        if (!form) return
        const q = questions[index]
        if (!q.id) return
        if (!confirm('Supprimer cette question ?')) return

        try {
            await deleteQuestion(form.id, q.id)
            setQuestions(questions.filter((_, i) => i !== index))
            toast.success('Question supprimée')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur')
        }
    }

    const handleMoveQuestion = async (fromIndex: number, direction: 'up' | 'down') => {
        if (!form) return
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
        if (toIndex < 0 || toIndex >= questions.length) return

        const newQuestions = [...questions]
        const [moved] = newQuestions.splice(fromIndex, 1)
        newQuestions.splice(toIndex, 0, moved)

        const reordered = newQuestions.map((q, i) => ({ ...q, order: i }))
        setQuestions(reordered)

        try {
            await reorderQuestions(
                form.id,
                reordered.filter((q) => q.id).map((q) => ({ id: q.id!, order: q.order }))
            )
        } catch (error: any) {
            toast.error('Erreur lors du réordonnement')
        }
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
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button type="button" variant="ghost" size="icon" onClick={() => router.push(`/forms/${form.id}`)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Modifier le formulaire</h1>
                            <p className="text-sm text-muted-foreground">
                                Modifiez les informations et les questions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form info */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-foreground">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(saveFormInfo)} className="space-y-4">
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
                            <Button type="submit" disabled={isSaving || !isDirty}>
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" /> Enregistrer
                                    </>
                                )}
                            </Button>
                        </form>
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
                                <Card key={question.id || index} className="border-0 shadow-sm animate-slide-up">
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
                                                    >
                                                        <ChevronDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Badge variant="secondary" className="font-mono">Q{index + 1}</Badge>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                                                    <TypeIcon className="h-4 w-4" />
                                                </div>
                                                {question.isDirty && (
                                                    <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-xs">
                                                        Non sauvegardé
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {question.isDirty && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUpdateQuestion(index)}
                                                        disabled={savingQuestionId === question.id}
                                                    >
                                                        {savingQuestionId === question.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Save className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteQuestion(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Question label */}
                                        <div className="space-y-2">
                                            <Label>Question</Label>
                                            <Input
                                                value={question.label}
                                                onChange={(e) => updateLocalQuestion(index, { label: e.target.value })}
                                                placeholder="Entrez votre question..."
                                            />
                                        </div>

                                        {/* Options for multiple choice */}
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

                                        {/* Required toggle */}
                                        <div className="flex items-center justify-between">
                                            <Label>Réponse obligatoire</Label>
                                            <Switch
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

                    {/* Add question buttons */}
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
        </AdminLayout>
    )
}
