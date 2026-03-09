'use client'

import { useEffect, useState, use } from 'react'
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
} from 'recharts'
import {
  ArrowLeft,
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Loader2,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { getInsights, getQuestionInsights } from '@/lib/api'
import { AIInsight, ThemeInsight, QuestionInsight, ChartData } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#60a5fa', '#34d399']

function InsightCard({
  title,
  items,
  icon: Icon,
  color = 'primary',
}: {
  title: string
  items: string[]
  icon: React.ElementType
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
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ThemeCard({ theme, index }: { theme: ThemeInsight; index: number }) {
  const barWidth = Math.min(100, Math.max(20, theme.count * 10))

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {theme.count} mention{theme.count > 1 ? 's' : ''}
          </Badge>
        </div>
        <h4 className="font-semibold mb-2">{theme.theme}</h4>
        {/* Visual bar */}
        <div className="h-2 rounded-full bg-muted mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="space-y-1">
          {theme.examples.slice(0, 3).map((example, index) => (
            <p key={index} className="text-sm text-muted-foreground italic">
              "{example}"
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config: Record<string, { label: string; color: string; emoji: string }> = {
    positif: { label: 'Positif', color: 'bg-green-500/10 text-green-600', emoji: '😊' },
    négatif: { label: 'Négatif', color: 'bg-red-500/10 text-red-600', emoji: '😟' },
    mitigé: { label: 'Mitigé', color: 'bg-orange-500/10 text-orange-600', emoji: '😐' },
  }
  const c = config[sentiment] || config['mitigé']

  return (
    <Badge variant="secondary" className={cn('text-xs gap-1', c.color)}>
      <span>{c.emoji}</span> {c.label}
    </Badge>
  )
}

function ThemeBarChart({ themes }: { themes: ThemeInsight[] }) {
  const chartData = themes.map((t) => ({
    label: t.theme.length > 20 ? t.theme.slice(0, 20) + '…' : t.theme,
    count: t.count,
  }))

  if (chartData.length === 0) return null

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Distribution des thèmes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="themeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
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
              <Bar dataKey="count" fill="url(#themeGradient)" radius={[0, 8, 8, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-accent animate-bounce" />
      </div>
      <h3 className="text-lg font-semibold mt-6">Analyse en cours...</h3>
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
        L'IA analyse les réponses de vos élèves. Cela peut prendre quelques secondes.
      </p>
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function InsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [insights, setInsights] = useState<AIInsight | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await getInsights(resolvedParams.id)
        setInsights(response.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de l\'analyse')
        toast.error('Erreur lors de l\'analyse IA')
      } finally {
        setIsLoading(false)
      }
    }
    fetchInsights()
  }, [resolvedParams.id])

  return (
    <AdminLayout title="Insights IA">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/forms/${resolvedParams.id}/analytics`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> Insights IA
            </h1>
            <p className="text-sm text-muted-foreground">Analyse intelligente des réponses</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8">
              <LoadingState />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Erreur</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : insights ? (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" /> Résumé global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed relative z-10">{insights.summary}</p>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid gap-4 md:grid-cols-2">
              <InsightCard
                title="Points forts"
                items={insights.strengths}
                icon={CheckCircle}
                color="green"
              />
              <InsightCard
                title="Points à améliorer"
                items={insights.weaknesses}
                icon={AlertTriangle}
                color="orange"
              />
            </div>

            {/* Suggestions */}
            <InsightCard
              title="Suggestions d'amélioration"
              items={insights.suggestions}
              icon={TrendingUp}
              color="primary"
            />

            {/* Open answers analysis with charts */}
            {insights.openAnswersSummary && insights.openAnswersSummary.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Analyse des réponses ouvertes
                </h2>
                {insights.openAnswersSummary.map((summary, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{summary.questionLabel}</Badge>
                      <SentimentBadge sentiment={summary.globalSentiment} />
                    </div>

                    {/* Theme bar chart */}
                    <ThemeBarChart themes={summary.themes} />

                    {/* Theme cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {summary.themes.map((theme, themeIndex) => (
                        <ThemeCard key={themeIndex} theme={theme} index={themeIndex} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
