'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  BarChart3,
  Users,
  FileText,
  Clock,
  QrCode,
  Link2,
  Eye,
  Edit2,
  Loader2,
  ChevronRight,
  Calendar,
  Brain,
  Share2,
} from 'lucide-react'
import { getForm, getResponses, toggleForm } from '@/lib/api'
import { Form, Response } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const questionTypeLabels: Record<string, string> = {
  yes_no: 'Oui / Non',
  multiple_choice: 'Choix multiple',
  rating: 'Note (1-5)',
  open: 'Texte libre',
}

function QuestionPreview({ question, index }: { question: Form['questions'][0]; index: number }) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3 animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Q{index + 1}</span>
        <Badge variant="secondary">{questionTypeLabels[question.type]}</Badge>
      </div>
      <p className="font-medium">{question.label}</p>
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-1">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full border" />
              {opt}
            </div>
          ))}
        </div>
      )}
      {question.type === 'yes_no' && (
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-sm">Oui</div>
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-sm">Non</div>
        </div>
      )}
      {question.type === 'rating' && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium">
              {n}
            </div>
          ))}
        </div>
      )}
      {question.type === 'open' && (
        <div className="h-16 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Zone de texte libre</span>
        </div>
      )}
      {question.required && (
        <span className="text-xs text-destructive">* Obligatoire</span>
      )}
    </div>
  )
}

function QRCodeTab({ form }: { form: Form }) {
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/respond/${form.token}`

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    toast.success('Lien copié !')
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5" /> QR Code
          </CardTitle>
          <CardDescription>
            Affichez ce QR code en classe pour que les élèves scannent et répondent
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-inner">
            <QRCodeSVG value={link} size={180} level="H" />
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center px-4">
            Scannez ce code pour accéder au formulaire
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Lien de partage
          </CardTitle>
          <CardDescription>
            Envoyez ce lien par email, WhatsApp ou autre moyen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={link} readOnly className="bg-muted/50 text-xs sm:text-sm" />
            <Button variant="outline" onClick={copyLink} className="shrink-0">
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copier</span>
            </Button>
          </div>
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 w-full transition-colors">
            <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir le formulaire
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

function ResponsesPreviewTab({ formId, responses }: { formId: string; responses: Response[] }) {
  const router = useRouter()

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" /> Réponses récentes
            </CardTitle>
            <CardDescription>{responses.length} réponse{responses.length > 1 ? 's' : ''} au total</CardDescription>
          </div>
          <Link
            href={`/forms/${formId}/responses`}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucune réponse pour le moment</p>
          </div>
        ) : (
          <div className="divide-y">
            {responses.slice(0, 5).map((response, index) => {
              const summary = response.answers
                .slice(0, 2)
                .map((a) => {
                  if (a.question?.type === 'yes_no') return a.value === true ? 'Oui' : 'Non'
                  if (a.question?.type === 'rating') return `${a.value}/5`
                  if (typeof a.value === 'string' && a.value.length > 30) return a.value.slice(0, 30) + '…'
                  return String(a.value)
                })
                .join(' • ')

              return (
                <div
                  key={response.id}
                  className="flex items-center gap-3 py-3 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  onClick={() => router.push(`/forms/${formId}/responses`)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{summary || 'Réponse'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(response.submittedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  const activeTab = searchParams.get('tab') || 'preview'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, responsesRes] = await Promise.all([
          getForm(resolvedParams.id),
          getResponses(resolvedParams.id).catch(() => ({ data: [] })),
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

  const handleToggle = async () => {
    if (!form) return
    setIsToggling(true)
    try {
      await toggleForm(form.id)
      setForm({ ...form, isOpen: !form.isOpen })
      toast.success(form.isOpen ? 'Formulaire fermé' : 'Formulaire ouvert')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    } finally {
      setIsToggling(false)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/respond/${form.token}`
    navigator.clipboard.writeText(link)
    toast.success('Lien copié !')
  }

  if (isLoading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    )
  }

  if (!form) return null

  return (
    <AdminLayout title={form.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-muted-foreground truncate">{form.description}</p>
              )}
            </div>
            <Button onClick={copyLink} className="shrink-0 gap-2" variant="default">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={form.isOpen ? 'default' : 'secondary'}
              className={cn(
                'font-medium cursor-pointer transition-colors flex items-center gap-1.5',
                form.isOpen && 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
              )}
              onClick={handleToggle}
            >
              {isToggling && <Loader2 className="h-3 w-3 animate-spin" />}
              {form.isOpen ? 'Ouvert' : 'Fermé'}
            </Badge>
            <Link href={`/forms/${form.id}/analytics`} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </Link>
            <Link href={`/forms/${form.id}/insights`} className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              <Brain className="h-4 w-4 mr-2" /> Insights
            </Link>
            <Link href={`/forms/${form.id}/edit`} className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all ml-auto sm:ml-0">
              <Edit2 className="h-4 w-4 mr-2" /> Modifier
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{form.questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{responses.length}</p>
                <p className="text-sm text-muted-foreground">Réponses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {new Date(form.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Créé le</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" /> Aperçu
            </TabsTrigger>
            <TabsTrigger value="responses">
              <Users className="h-4 w-4 mr-2" /> Réponses
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-2" /> Partage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Aperçu du formulaire</CardTitle>
                <CardDescription>
                  Voici comment les élèves verront le formulaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.questions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune question pour le moment
                  </p>
                ) : (
                  form.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <QuestionPreview key={question.id} question={question} index={index} />
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="mt-6">
            <ResponsesPreviewTab formId={form.id} responses={responses} />
          </TabsContent>

          <TabsContent value="qr" className="mt-6">
            <QRCodeTab form={form} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
