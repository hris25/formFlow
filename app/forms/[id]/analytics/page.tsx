'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Download,
  FileText,
  Loader2,
  Brain,
  MessageSquare,
  Sparkles,
  Eye,
} from 'lucide-react'
import { getAnalytics, getResponses, getQuestionAnalytics, getQuestionInsights } from '@/lib/api'
import { Analytics, Response, QuestionAnalytics, ChartData, QuestionInsight } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#60a5fa', '#34d399', '#fbbf24']
const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#818cf8' },
  { start: '#8b5cf6', end: '#a78bfa' },
  { start: '#a855f7', end: '#c084fc' },
]

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'primary',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  color?: 'primary' | 'accent' | 'green' | 'orange'
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-500/10 text-green-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function EnhancedBarChart({ data, title }: { data: ChartData[]; title: string }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="label"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px',
                }}
                formatter={(value: number, name: string) => [`${value} réponses`, '']}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function EnhancedPieChart({ data, title }: { data: ChartData[]; title: string }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="label"
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className="drop-shadow-sm"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                  padding: '12px 16px',
                }}
                formatter={(value: number, name: string) => [`${value} (${data.find(d => d.count === value)?.percentage || 0}%)`, name]}
              />
              <Legend
                formatter={(value: string) => <span className="text-sm text-foreground">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function RatingChart({ data, average, title }: { data: ChartData[]; average: number; title: string }) {
  const radialData = [{ name: 'score', value: (average / 5) * 100, fill: '#6366f1' }]

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {average.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value: number) => [`${value} réponses`, '']}
              />
              <Bar dataKey="count" fill="url(#ratingGradient)" radius={[8, 8, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Rating distribution bar */}
        <div className="mt-4 flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
          {data.map((d, i) => (
            <div
              key={i}
              className="transition-all duration-500"
              style={{
                width: `${d.percentage}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>1 ★</span>
          <span>5 ★</span>
        </div>
      </CardContent>
    </Card>
  )
}

function OpenAnswersList({ answers, title, questionId, formId }: {
  answers: string[]
  title: string
  questionId: string
  formId: string
}) {
  const [aiInsight, setAiInsight] = useState<QuestionInsight | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  const handleAiAnalysis = async () => {
    setLoadingAi(true)
    try {
      const res = await getQuestionInsights(formId, questionId)
      setAiInsight(res.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'analyse IA')
    } finally {
      setLoadingAi(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> {title}
          </CardTitle>
          {!aiInsight && (
            <Button variant="outline" size="sm" onClick={handleAiAnalysis} disabled={loadingAi}>
              {loadingAi ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Analyse IA
            </Button>
          )}
        </div>
        <CardDescription>{answers.length} réponse{answers.length > 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI insight chart */}
        {aiInsight && (
          <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-sm">Analyse IA — Thèmes identifiés</h4>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  aiInsight.globalSentiment === 'positif' && 'bg-green-500/10 text-green-600',
                  aiInsight.globalSentiment === 'négatif' && 'bg-red-500/10 text-red-600',
                  aiInsight.globalSentiment === 'mitigé' && 'bg-orange-500/10 text-orange-600'
                )}
              >
                {aiInsight.globalSentiment}
              </Badge>
            </div>
            {aiInsight.chart && aiInsight.chart.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiInsight.chart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                      }}
                      formatter={(value: number) => [`${value} mentions`, '']}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} animationDuration={600} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {aiInsight.suggestion && (
              <p className="text-sm text-muted-foreground italic bg-background/50 p-3 rounded-lg">
                💡 {aiInsight.suggestion}
              </p>
            )}
          </div>
        )}

        {/* Answers list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
          {answers.map((answer, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/50 text-sm hover:bg-muted transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              "{answer}"
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuestionAnalyticsCard({ analytics, formId }: { analytics: QuestionAnalytics; formId: string }) {
  const renderChart = () => {
    switch (analytics.type) {
      case 'yes_no':
        return analytics.chart && <EnhancedPieChart data={analytics.chart} title={analytics.label} />
      case 'multiple_choice':
        return analytics.chart && <EnhancedBarChart data={analytics.chart} title={analytics.label} />
      case 'rating':
        return analytics.chart && analytics.average !== undefined && (
          <RatingChart data={analytics.chart} average={analytics.average} title={analytics.label} />
        )
      case 'open':
        return analytics.answers && (
          <OpenAnswersList
            answers={analytics.answers}
            title={analytics.label}
            questionId={analytics.questionId}
            formId={formId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {analytics.totalAnswers} réponse{analytics.totalAnswers > 1 ? 's' : ''}
        </Badge>
      </div>
      {renderChart()}
    </div>
  )
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, responsesRes] = await Promise.all([
          getAnalytics(resolvedParams.id),
          getResponses(resolvedParams.id),
        ])
        setAnalytics(analyticsRes.data)
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

  const exportCSV = () => {
    if (!analytics || !responses.length) return

    const csvData = responses.map((response) => {
      const row: Record<string, string> = {
        Date: new Date(response.submittedAt).toLocaleString('fr-FR'),
      }
      response.answers.forEach((answer) => {
        const question = analytics.analytics.find((a) => a.questionId === answer.questionId)
        if (question) {
          const value = Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value)
          row[question.label] = value
        }
      })
      return row
    })

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${analytics.title}-reponses.csv`
    link.click()
    toast.success('Export CSV téléchargé')
  }

  const exportPDF = () => {
    if (!analytics) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(20)
    doc.setTextColor(99, 102, 241)
    doc.text(analytics.title, pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Rapport d'analyse — ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`${analytics.totalResponses} réponse${analytics.totalResponses > 1 ? 's' : ''}`, pageWidth / 2, 38, { align: 'center' })

    let yPos = 50

    analytics.analytics.forEach((q, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`${index + 1}. ${q.label}`, 14, yPos)
      yPos += 8

      if (q.type === 'rating' && q.average) {
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Moyenne: ${q.average.toFixed(1)} / 5`, 20, yPos)
        yPos += 10
      } else if (q.chart) {
        const tableData = q.chart.map((c) => [c.label, `${c.count} (${c.percentage}%)`])
        autoTable(doc, {
          startY: yPos,
          head: [['Réponse', 'Nombre']],
          body: tableData,
          margin: { left: 20 },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [99, 102, 241] },
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
      } else if (q.answers && q.answers.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(100)
        q.answers.slice(0, 5).forEach((answer) => {
          if (yPos > 280) return
          const lines = doc.splitTextToSize(`• "${answer}"`, pageWidth - 40)
          doc.text(lines, 20, yPos)
          yPos += lines.length * 4 + 2
        })
        if (q.answers.length > 5) {
          doc.text(`... et ${q.answers.length - 5} autres réponses`, 20, yPos)
          yPos += 8
        }
        yPos += 5
      }
    })

    doc.save(`${analytics.title}-rapport.pdf`)
    toast.success('Export PDF téléchargé')
  }

  if (isLoading) {
    return (
      <AdminLayout title="Analytics">
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

  if (!analytics) return null

  const avgRating = analytics.analytics
    .filter((a) => a.type === 'rating' && a.average)
    .reduce((acc, a) => acc + (a.average || 0), 0) /
    (analytics.analytics.filter((a) => a.type === 'rating').length || 1)

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/forms/${resolvedParams.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{analytics.title}</h1>
              <p className="text-sm text-muted-foreground">Analyse complète des réponses</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!responses.length}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Link
              href={`/forms/${resolvedParams.id}/responses`}
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" /> Réponses
            </Link>
            <Link
              href={`/forms/${resolvedParams.id}/insights`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
            >
              <Brain className="h-4 w-4 mr-2" /> Insights IA
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total réponses"
            value={analytics.totalResponses}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Questions"
            value={analytics.analytics.length}
            icon={BarChart3}
            color="accent"
          />
          <StatCard
            title="Note moyenne"
            value={avgRating > 0 ? `${avgRating.toFixed(1)}/5` : 'N/A'}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Taux complétion"
            value={analytics.totalResponses > 0 ? '100%' : '0%'}
            icon={FileText}
            color="orange"
          />
        </div>

        {/* Charts by question */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Résultats par question</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {analytics.analytics.map((q) => (
              <QuestionAnalyticsCard key={q.questionId} analytics={q} formId={resolvedParams.id} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
