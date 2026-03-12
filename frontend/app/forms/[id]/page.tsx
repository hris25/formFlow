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
  Brain,
  Share2,
  MessageCircle,
  Mail,
  Check,
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
        <span className="text-sm font-medium text-foreground">Q{index + 1}</span>
        <Badge variant="secondary">{questionTypeLabels[question.type]}</Badge>
      </div>
      <p className="font-medium text-foreground">{question.label}</p>
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-1">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
              {opt}
            </div>
          ))}
        </div>
      )}
      {question.type === 'yes_no' && (
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">Oui</div>
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">Non</div>
        </div>
      )}
      {question.type === 'rating' && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-sm font-medium text-foreground">
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

// Social sharing buttons component
function ShareButtons({ link, title }: { link: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const encoded = encodeURIComponent(link)
  const encodedTitle = encodeURIComponent(title)

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: link })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  const socialLinks = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
      color: 'bg-green-500 hover:bg-green-600 text-white',
      icon: MessageCircle,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: Share2,
    },
    {
      name: 'Twitter',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      color: 'bg-sky-500 hover:bg-sky-600 text-white',
      icon: ExternalLink,
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=Répondez%20au%20formulaire%20:%20${encoded}`,
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Copy link */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={link}
            readOnly
            className="bg-muted/50 text-xs sm:text-sm font-mono flex-1 min-w-0 truncate"
          />
          <Button
            variant={copied ? 'default' : 'outline'}
            onClick={copyLink}
            className={cn('shrink-0 min-w-[100px] transition-all', copied && 'bg-green-500 hover:bg-green-500')}
          >
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copié !</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copier</>
            )}
          </Button>
        </div>
      </div>

      {/* Native share (mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button onClick={nativeShare} className="w-full gap-2" variant="default">
          <Share2 className="h-4 w-4" /> Partager...
        </Button>
      )}

      {/* Social buttons grid */}
      <div className="grid grid-cols-2 gap-2">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              social.color
            )}
          >
            <social.icon className="h-4 w-4" />
            {social.name}
          </a>
        ))}
      </div>

      {/* Open form link */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted w-full transition-colors text-foreground"
      >
        <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir le formulaire
      </a>
    </div>
  )
}

function QRCodeTab({ form }: { form: Form }) {
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/respond/${form.token}`

  return (
    <div className="space-y-6 overflow-hidden">
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <QrCode className="h-5 w-5" /> QR Code
          </CardTitle>
          <CardDescription>
            Affichez ce QR code en classe pour que les élèves scannent et répondent
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center overflow-hidden">
          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-inner max-w-full overflow-hidden">
            <QRCodeSVG value={link} size={180} level="H" className="max-w-full h-auto" />
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center px-4">
            Scannez ce code pour accéder au formulaire
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <Share2 className="h-5 w-5" /> Partager le formulaire
          </CardTitle>
          <CardDescription>
            Envoyez le lien par email, réseaux sociaux ou messagerie
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ShareButtons link={link} title={form.title} />
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
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" /> Réponses récentes
            </CardTitle>
            <CardDescription>{responses.length} réponse{responses.length > 1 ? 's' : ''} au total</CardDescription>
          </div>
          <Link
            href={`/forms/${formId}/responses`}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors text-foreground shrink-0"
          >
            <span className="hidden sm:inline">Voir toutes</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
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
          <div className="divide-y divide-border">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-xs font-semibold text-primary">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{summary || 'Réponse'}</p>
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

// Action card component for form detail
function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  color,
  loading,
}: {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
  color: string
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card text-left transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 w-full',
        'focus-visible:outline-2 focus-visible:outline-primary'
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
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
    if (!form) return
    const link = `${window.location.origin}/respond/${form.token}`
    navigator.clipboard.writeText(link)
    toast.success('Lien copié !')
  }

  const shareLink = async () => {
    if (!form) return
    const link = `${window.location.origin}/respond/${form.token}`
    if (navigator.share) {
      try {
        await navigator.share({ title: form.title, url: link })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Chargement...">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
      <div className="space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate text-foreground">{form.title}</h1>
              {form.description && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{form.description}</p>
              )}
            </div>
            <Badge
              variant={form.isOpen ? 'default' : 'secondary'}
              className={cn(
                'font-medium shrink-0',
                form.isOpen && 'bg-green-500/10 text-green-600 dark:text-green-400'
              )}
            >
              {form.isOpen ? 'Ouvert' : 'Fermé'}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{form.questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{responses.length}</p>
                <p className="text-sm text-muted-foreground">Réponses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
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

        {/* Action cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <ActionCard
            icon={BarChart3}
            title="Analytics"
            description="Statistiques"
            onClick={() => router.push(`/forms/${form.id}/analytics`)}
            color="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
          />
          <ActionCard
            icon={Brain}
            title="Insights"
            description="Analyse IA"
            onClick={() => router.push(`/forms/${form.id}/insights`)}
            color="bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
          />
          <ActionCard
            icon={Edit2}
            title="Modifier"
            description="Éditer questions"
            onClick={() => router.push(`/forms/${form.id}/edit`)}
            color="bg-primary/10 dark:bg-primary/20 text-primary"
          />
          <ActionCard
            icon={Users}
            title="Réponses"
            description={`${responses.length} reçues`}
            onClick={() => router.push(`/forms/${form.id}/responses`)}
            color="bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
          />
          <ActionCard
            icon={Share2}
            title="Partager"
            description="Lien / QR Code"
            onClick={shareLink}
            color="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400"
          />
          <ActionCard
            icon={form.isOpen ? Clock : Eye}
            title={form.isOpen ? 'Fermer' : 'Ouvrir'}
            description={form.isOpen ? 'Fermer le sondage' : 'Ouvrir le sondage'}
            onClick={handleToggle}
            color={form.isOpen
              ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
              : 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400'
            }
            loading={isToggling}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="w-full overflow-hidden">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="preview" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Aperçu</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Réponses</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Partage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6 overflow-hidden">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Aperçu du formulaire</CardTitle>
                <CardDescription>
                  Voici comment les élèves verront le formulaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-hidden">
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

          <TabsContent value="responses" className="mt-6 overflow-hidden">
            <ResponsesPreviewTab formId={form.id} responses={responses} />
          </TabsContent>

          <TabsContent value="qr" className="mt-6 overflow-hidden">
            <QRCodeTab form={form} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating share FAB (mobile) */}
      <button
        onClick={shareLink}
        className="fixed bottom-6 right-6 lg:hidden flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all z-50 active:scale-95"
      >
        <Share2 className="h-6 w-6" />
      </button>
    </AdminLayout>
  )
}
