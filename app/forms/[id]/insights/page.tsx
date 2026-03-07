'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { getInsights } from '@/lib/api'
import { AIInsight, ThemeInsight } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    <Card className="border-0 shadow-sm">
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
              <li key={index} className="flex items-start gap-2 text-sm">
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

function ThemeCard({ theme }: { theme: ThemeInsight }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary">{theme.count} mention{theme.count > 1 ? 's' : ''}</Badge>
        </div>
        <h4 className="font-semibold mb-2">{theme.theme}</h4>
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
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" /> Résumé global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{insights.summary}</p>
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

            {/* Open answers analysis */}
            {insights.openAnswersSummary && insights.openAnswersSummary.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Analyse des réponses ouvertes
                </h2>
                {insights.openAnswersSummary.map((summary, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{summary.questionLabel}</Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          summary.globalSentiment === 'positif' && 'bg-green-500/10 text-green-600',
                          summary.globalSentiment === 'négatif' && 'bg-red-500/10 text-red-600',
                          summary.globalSentiment === 'mitigé' && 'bg-orange-500/10 text-orange-600'
                        )}
                      >
                        Sentiment: {summary.globalSentiment}
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {summary.themes.map((theme, themeIndex) => (
                        <ThemeCard key={themeIndex} theme={theme} />
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
