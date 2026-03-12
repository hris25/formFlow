'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Search, X, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { useUIStore, useFormsStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  icon: React.ElementType
  color: string
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const { setSidebarOpen } = useUIStore()
  const { forms } = useFormsStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Build notifications from forms data (frontend-only)
  const notifications = useMemo<Notification[]>(() => {
    const notifs: Notification[] = []
    const now = new Date()

    forms.forEach((form) => {
      const created = new Date(form.createdAt)
      const diffHrs = (now.getTime() - created.getTime()) / (1000 * 60 * 60)

      if (diffHrs < 24) {
        notifs.push({
          id: `new-${form.id}`,
          title: 'Nouveau formulaire',
          message: `"${form.title}" a été créé`,
          time: created.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          read: false,
          icon: FileText,
          color: 'text-primary bg-primary/10',
        })
      }

      if ((form._count?.responses || 0) > 0) {
        notifs.push({
          id: `resp-${form.id}`,
          title: 'Réponses reçues',
          message: `${form._count?.responses} réponse${(form._count?.responses || 0) > 1 ? 's' : ''} sur "${form.title}"`,
          time: 'Récent',
          read: true,
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400 bg-green-500/10',
        })
      }

      if (!form.isOpen) {
        notifs.push({
          id: `closed-${form.id}`,
          title: 'Formulaire fermé',
          message: `"${form.title}" est fermé`,
          time: '',
          read: true,
          icon: Clock,
          color: 'text-orange-500 dark:text-orange-400 bg-orange-500/10',
        })
      }
    })

    return notifs.slice(0, 8)
  }, [forms])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Search results from forms
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return forms
      .filter((f) => f.title.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q))
      .slice(0, 5)
  }, [forms, searchQuery])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-lg font-semibold truncate text-foreground">{title}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div ref={searchRef} className="relative">
          {/* Desktop search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un formulaire..."
              className="w-64 pl-9 bg-muted/50 text-foreground"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false) }}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Search dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute right-0 md:left-0 top-full mt-2 w-72 md:w-80 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucun résultat pour "{searchQuery}"
                </div>
              ) : (
                <div className="py-1">
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                  </p>
                  {searchResults.map((form) => (
                    <button
                      key={form.id}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                      onClick={() => {
                        router.push(`/forms/${form.id}`)
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{form.title}</p>
                        {form.description && (
                          <p className="text-xs text-muted-foreground truncate">{form.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile search input (full width overlay) */}
          {searchOpen && (
            <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-background border-b border-border p-3 animate-slide-down">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un formulaire..."
                  className="pl-9 pr-9 bg-muted/50 text-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {searchQuery.trim() && (
                <div className="mt-2 rounded-lg border border-border bg-popover overflow-hidden max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Aucun résultat
                    </div>
                  ) : (
                    searchResults.map((form) => (
                      <button
                        key={form.id}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                        onClick={() => {
                          router.push(`/forms/${form.id}`)
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate text-foreground">{form.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false) }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = notif.icon
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0',
                          !notif.read && 'bg-primary/5'
                        )}
                      >
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', notif.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                          {notif.time && <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>}
                        </div>
                        {!notif.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
