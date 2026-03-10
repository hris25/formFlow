'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Users,
    Eye,
    Trash2,
    Download,
    FileText,
    Calendar,
    ChevronRight,
    X,
    Loader2,
    CheckCircle,
    XCircle,
    Star,
    MessageSquare,
    BarChart3,
} from 'lucide-react'
import Papa from 'papaparse'
import { getForm, getResponses, getResponse, deleteResponse } from '@/lib/api'
import { Form, Response } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function ResponseDetailDialog({
    response,
    open,
    onClose,
}: {
    response: Response | null
    open: boolean
    onClose: () => void
}) {
    if (!response) return null

    const formatValue = (answer: Response['answers'][0]) => {
        const { value, question } = answer
        if (!question) return String(value)

        switch (question.type) {
            case 'yes_no':
                return value === true ? (
                    <span className="inline-flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="h-4 w-4" /> Oui
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-red-600">
                        <XCircle className="h-4 w-4" /> Non
                    </span>
                )
            case 'rating':
                return (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                                key={n}
                                className={cn(
                                    'h-4 w-4',
                                    n <= Number(value) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                                )}
                            />
                        ))}
                        <span className="ml-1 text-sm font-medium">{value}/5</span>
                    </div>
                )
            case 'multiple_choice':
                return (
                    <Badge variant="secondary" className="font-normal">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                    </Badge>
                )
            case 'open':
                return (
                    <p className="text-sm bg-muted/50 p-3 rounded-lg italic">"{String(value)}"</p>
                )
            default:
                return String(value)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" /> Détail de la réponse
                    </DialogTitle>
                    <DialogDescription>
                        Soumise le{' '}
                        {new Date(response.submittedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    {response.answers.map((answer, index) => (
                        <div key={answer.id || index} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                                    {index + 1}
                                </span>
                                <p className="text-sm font-medium">{answer.question?.label || 'Question'}</p>
                            </div>
                            <div className="pl-8">{formatValue(answer)}</div>
                            {index < response.answers.length - 1 && <Separator className="mt-3" />}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ResponseRow({
    response,
    index,
    form,
    onView,
    onDelete,
}: {
    response: Response
    index: number
    form: Form
    onView: () => void
    onDelete: () => void
}) {
    const date = new Date(response.submittedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
    const time = new Date(response.submittedAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    // Build a quick summary - first few answer values
    const summary = response.answers
        .slice(0, 3)
        .map((a) => {
            if (a.question?.type === 'yes_no') return a.value === true ? 'Oui' : 'Non'
            if (a.question?.type === 'rating') return `${a.value}/5`
            if (typeof a.value === 'string' && a.value.length > 25) return a.value.slice(0, 25) + '…'
            return String(a.value)
        })
        .join(' • ')

    return (
        <div
            className="group flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 30}ms` }}
            onClick={onView}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                #{index + 1}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{summary || 'Réponse'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {date} à {time}
                </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                    {response.answers.length} réponse{response.answers.length > 1 ? 's' : ''}
                </Badge>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                        e.stopPropagation()
                        onView()
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
    )
}

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [form, setForm] = useState<Form | null>(null)
    const [responses, setResponses] = useState<Response[]>([])
    const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [formRes, responsesRes] = await Promise.all([
                    getForm(resolvedParams.id),
                    getResponses(resolvedParams.id),
                ])
                setForm(formRes.data)
                setResponses(responsesRes.data)
            } catch (error) {
                toast.error('Erreur lors du chargement')
                router.push('/dashboard')
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [resolvedParams.id, router])

    const handleViewResponse = async (response: Response) => {
        setLoadingDetail(true)
        setDialogOpen(true)
        try {
            const res = await getResponse(resolvedParams.id, response.id)
            setSelectedResponse(res.data)
        } catch {
            setSelectedResponse(response) // fallback to list data
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleDeleteResponse = async (responseId: string) => {
        if (!confirm('Supprimer cette réponse ?')) return
        try {
            await deleteResponse(resolvedParams.id, responseId)
            setResponses(responses.filter((r) => r.id !== responseId))
            toast.success('Réponse supprimée')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erreur')
        }
    }

    const exportCSV = () => {
        if (!form || !responses.length) return

        const csvData = responses.map((response, idx) => {
            const row: Record<string, string> = {
                '#': String(idx + 1),
                Date: new Date(response.submittedAt).toLocaleString('fr-FR'),
            }
            response.answers.forEach((answer) => {
                const label = answer.question?.label || 'Q'
                const value = Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value)
                row[label] = value
            })
            return row
        })

        const csv = Papa.unparse(csvData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${form.title}-reponses.csv`
        link.click()
        toast.success('Export CSV téléchargé')
    }

    if (isLoading) {
        return (
            <AdminLayout title="Réponses">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-64" />
                </div>
            </AdminLayout>
        )
    }

    if (!form) return null

    return (
        <AdminLayout title="Réponses">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/forms/${resolvedParams.id}`)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">{form.title}</h1>
                            <p className="text-sm text-muted-foreground">Réponses individuelles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={exportCSV} disabled={!responses.length}>
                            <Download className="h-4 w-4 mr-2" /> CSV
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/forms/${resolvedParams.id}/analytics`)}>
                            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{responses.length}</p>
                                <p className="text-sm text-muted-foreground">Réponses totales</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{form.questions.length}</p>
                                <p className="text-sm text-muted-foreground">Questions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {responses.length > 0
                                        ? new Date(responses[0].submittedAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                        })
                                        : '—'}
                                </p>
                                <p className="text-sm text-muted-foreground">Dernière réponse</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Responses list */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-5 w-5" /> Toutes les réponses
                        </CardTitle>
                        <CardDescription>
                            Cliquez sur une réponse pour voir le détail complet
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {responses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                                    <Users className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-semibold">Aucune réponse</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                    Partagez le lien de votre formulaire pour collecter des réponses.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {responses.map((response, index) => (
                                    <ResponseRow
                                        key={response.id}
                                        response={response}
                                        index={index}
                                        form={form}
                                        onView={() => handleViewResponse(response)}
                                        onDelete={() => handleDeleteResponse(response.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail dialog */}
            <ResponseDetailDialog
                response={selectedResponse}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setSelectedResponse(null)
                }}
            />
        </AdminLayout>
    )
}
