'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Users, Clock, MoreVertical, ExternalLink, Copy, Trash2, BarChart3, QrCode, Loader2, Share2 } from 'lucide-react'
import { getForms, toggleForm, deleteForm } from '@/lib/api'
import { useFormsStore, useAuthStore } from '@/stores'
import { Form } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateFormModal } from '@/components/forms/create-form-modal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function StatsCards({ forms }: { forms: Form[] }) {
  const totalResponses = forms.reduce((acc, f) => acc + (f._count?.responses || 0), 0)
  const openForms = forms.filter((f) => f.isOpen).length

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Formulaires</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{forms.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Total créés</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-accent/5 to-accent/10 dark:from-accent/10 dark:to-accent/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Réponses</CardTitle>
          <Users className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{totalResponses}</div>
          <p className="text-xs text-muted-foreground mt-1">Total reçues</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Ouverts</CardTitle>
          <Clock className="h-4 w-4 text-green-500 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{openForms}</div>
          <p className="text-xs text-muted-foreground mt-1">En cours</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500/5 to-orange-500/10 dark:from-orange-500/10 dark:to-orange-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Fermés</CardTitle>
          <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{forms.length - openForms}</div>
          <p className="text-xs text-muted-foreground mt-1">Terminés</p>
        </CardContent>
      </Card>
    </div>
  )
}

function FormCard({ form, onRefresh }: { form: Form; onRefresh: () => void }) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await toggleForm(form.id)
      toast.success(form.isOpen ? 'Formulaire fermé' : 'Formulaire ouvert')
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce formulaire et toutes ses réponses ?')) return
    setIsDeleting(true)
    try {
      await deleteForm(form.id)
      toast.success('Formulaire supprimé')
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    } finally {
      setIsDeleting(false)
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/respond/${form.token}`
    navigator.clipboard.writeText(link)
    toast.success('Lien copié !')
  }

  const shareLink = async () => {
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

  const createdDate = new Date(form.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className={cn(
      'group border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
      (isToggling || isDeleting) && 'opacity-60 pointer-events-none'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/forms/${form.id}`)}>
            <CardTitle className="text-base font-semibold truncate text-foreground hover:text-primary transition-colors">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="mt-1 line-clamp-2">{form.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={shareLink}>
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/analytics`)}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" /> Copier le lien
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}?tab=qr`)}>
                  <QrCode className="h-4 w-4 mr-2" /> QR Code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4 mr-2" />
                  )}
                  {form.isOpen ? 'Fermer' : 'Ouvrir'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={form.isOpen ? 'default' : 'secondary'}
              className={cn(
                'font-medium',
                form.isOpen && 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
              )}
            >
              {form.isOpen ? 'Ouvert' : 'Fermé'}
            </Badge>
            <span className="text-xs text-muted-foreground">{createdDate}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {form._count?.questions || 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {form._count?.responses || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Aucun formulaire</h3>
      <p className="text-muted-foreground mt-1 mb-4 max-w-sm">
        Créez votre premier formulaire pour commencer à collecter les retours de vos élèves.
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <Plus className="h-4 w-4" /> Créer un formulaire
      </Button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { forms, setForms, setLoading, isLoading } = useFormsStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const fetchForms = async () => {
    setLoading(true)
    try {
      const response = await getForms()
      setForms(response.data)
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchForms()
    }
  }, [authLoading, isAuthenticated])

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        {!isLoading && forms.length > 0 && <StatsCards forms={forms} />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Mes formulaires</h2>
            <p className="text-sm text-muted-foreground">
              Gérez vos sondages et consultez les réponses
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" /> Nouveau formulaire
          </Button>
        </div>

        {/* Forms grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : forms.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateModalOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} onRefresh={fetchForms} />
            ))}
          </div>
        )}
      </div>

      {/* FAB Mobile */}
      <button
        onClick={() => setCreateModalOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all z-50 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create Form Modal */}
      <CreateFormModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </AdminLayout>
  )
}