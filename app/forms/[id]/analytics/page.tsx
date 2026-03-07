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
} from 'lucide-react'
import { getAnalytics, getResponses } from '@/lib/api'
import { Analytics, Response, QuestionAnalytics, ChartData } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe']

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
    <Card className="border-0 shadow-sm">
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

function BarChartWidget({ data, title }: { data: ChartData[]; title: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function PieChartWidget({ data, title }: { data: ChartData[]; title: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                formatter={(value: string) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function RatingChart({ data, average, title }: { data: ChartData[]; average: number; title: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{average.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function OpenAnswersList({ answers, title }: { answers: string[]; title: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> {title}
        </CardTitle>
        <CardDescription>{answers.length} réponse{answers.length > 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {answers.map((answer, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/50 text-sm"
            >
              "{answer}"
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuestionAnalyticsCard({ analytics }: { analytics: QuestionAnalytics }) {
  const renderChart = () => {
    switch (analytics.type) {
      case 'yes_no':
        return analytics.chart && <PieChartWidget data={analytics.chart} title={analytics.label} />
      case 'multiple_choice':
        return analytics.chart && <BarChartWidget data={analytics.chart} title={analytics.label} />
      case 'rating':
        return analytics.chart && analytics.average && (
          <RatingChart data={analytics.chart} average={analytics.average} title={analytics.label} />
        )
      case 'open':
        return analytics.answers && <OpenAnswersList answers={analytics.answers} title={analytics.label} />
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

    // Title
    doc.setFontSize(20)
    doc.setTextColor(99, 102, 241) // primary color
    doc.text(analytics.title, pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Rapport d'analyse - ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' })

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
              <p className="text-sm text-muted-foreground">Analyse des réponses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={!responses.length}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Link href={`/forms/${resolvedParams.id}/insights`} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                <Brain className="h-4 w-4 mr-2" /> Insights IA
              </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
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
            title="Taux de réponse"
            value={analytics.totalResponses > 0 ? '100%' : '0%'}
            icon={TrendingUp}
            color="green"
          />
        </div>

        {/* Charts by question */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Résultats par question</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {analytics.analytics.map((q) => (
              <QuestionAnalyticsCard key={q.questionId} analytics={q} />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
