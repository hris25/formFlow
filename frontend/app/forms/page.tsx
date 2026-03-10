'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Users,
  Clock,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  BarChart3,
  QrCode,
  Search,
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react'
import { getForms, toggleForm, deleteForm } from '@/lib/api'
import { useFormsStore, useAuthStore } from '@/stores'
import { Form } from '@/types'
import { AdminLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SortKey = 'date' | 'title' | 'responses'
type FilterStatus = 'all' | 'open' | 'closed'
type ViewMode = 'grid' | 'list'

function FormCard({ form, onRefresh, viewMode }: { form: Form; onRefresh: () => void; viewMode: ViewMode }) {
  const router = useRouter()

  const handleToggle = async () => {
    try {
      await toggleForm(form.id)
      toast.success(form.isOpen ? 'Formulaire fermé' : 'Formulaire ouvert')
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce formulaire et toutes ses réponses ?')) return
    try {
      await deleteForm(form.id)
      toast.success('Formulaire supprimé')
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur')
    }
  }

  const copyLink = () => {
    const link = `${window.location.origin}/respond/${form.token}`
    navigator.clipboard.writeText(link)
    toast.success('Lien copié !')
  }

  const createdDate = new Date(form.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (viewMode === 'list') {
    return (
      <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/forms/${form.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
              {form.title}
            </Link>
            {form.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{form.description}</p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {form._count?.questions || 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {form._count?.responses || 0}
            </span>
          </div>
          <Badge
            variant={form.isOpen ? 'default' : 'secondary'}
            className={cn(
              'font-medium shrink-0',
              form.isOpen && 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
            )}
          >
            {form.isOpen ? 'Ouvert' : 'Fermé'}
          </Badge>
          <span className="hidden md:block text-xs text-muted-foreground shrink-0">{createdDate}</span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/edit`)}>
                <FileText className="h-4 w-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/analytics`)}>
                <BarChart3 className="h-4 w-4 mr-2" /> Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/responses`)}>
                <Users className="h-4 w-4 mr-2" /> Réponses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" /> Copier le lien
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggle}>
                <Clock className="h-4 w-4 mr-2" />
                {form.isOpen ? 'Fermer' : 'Ouvrir'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/forms/${form.id}`}>
              <CardTitle className="text-base font-semibold truncate hover:text-primary transition-colors cursor-pointer">
                {form.title}
              </CardTitle>
            </Link>
            {form.description && (
              <CardDescription className="mt-1 line-clamp-2">{form.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/edit`)}>
                <FileText className="h-4 w-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/analytics`)}>
                <BarChart3 className="h-4 w-4 mr-2" /> Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/responses`)}>
                <Users className="h-4 w-4 mr-2" /> Réponses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" /> Copier le lien
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}?tab=qr`)}>
                <QrCode className="h-4 w-4 mr-2" /> QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggle}>
                <Clock className="h-4 w-4 mr-2" />
                {form.isOpen ? 'Fermer' : 'Ouvrir'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={form.isOpen ? 'default' : 'secondary'}
              className={cn(
                'font-medium',
                form.isOpen && 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {hasFilter ? (
          <Search className="h-8 w-8 text-muted-foreground" />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-semibold">
        {hasFilter ? 'Aucun résultat' : 'Aucun formulaire'}
      </h3>
      <p className="text-muted-foreground mt-1 mb-4 max-w-sm">
        {hasFilter
          ? 'Aucun formulaire ne correspond à votre recherche. Essayez de modifier vos filtres.'
          : 'Créez votre premier formulaire pour commencer à collecter les retours de vos élèves.'}
      </p>
      {!hasFilter && (
        <Link
          href="/forms/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" /> Créer un formulaire
        </Link>
      )}
    </div>
  )
}

export default function FormsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { forms, setForms, setLoading, isLoading } = useFormsStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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

  const filteredAndSorted = useMemo(() => {
    let result = [...forms]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (filterStatus === 'open') result = result.filter((f) => f.isOpen)
    if (filterStatus === 'closed') result = result.filter((f) => !f.isOpen)

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'responses':
          return (b._count?.responses || 0) - (a._count?.responses || 0)
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [forms, search, filterStatus, sortBy])

  const hasActiveFilter = search.trim() !== '' || filterStatus !== 'all'

  return (
    <AdminLayout title="Formulaires">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Tous les formulaires</h2>
            <p className="text-sm text-muted-foreground">
              {forms.length} formulaire{forms.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <Link
            href="/forms/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 shadow-lg shadow-primary/25 w-full sm:w-auto transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            <Plus className="h-4 w-4 mr-2" /> Nouveau formulaire
          </Link>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un formulaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(v: FilterStatus) => setFilterStatus(v)}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="open">Ouverts</SelectItem>
                <SelectItem value="closed">Fermés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Plus récent</SelectItem>
                <SelectItem value="title">Alphabétique</SelectItem>
                <SelectItem value="responses">Plus de réponses</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Forms */}
        {isLoading ? (
          <div className={cn(
            'gap-4',
            viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'
          )}>
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
        ) : filteredAndSorted.length === 0 ? (
          <EmptyState hasFilter={hasActiveFilter} />
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          )}>
            {filteredAndSorted.map((form, index) => (
              <div
                key={form.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <FormCard form={form} onRefresh={fetchForms} viewMode={viewMode} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
