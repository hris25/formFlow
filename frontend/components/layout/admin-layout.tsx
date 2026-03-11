'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useUIStore } from '@/stores'
import { getProfile } from '@/lib/api'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Loader2, RefreshCw, WifiOff } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, token, setUser, setLoading } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const [serverSleeping, setServerSleeping] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [loadTimer, setLoadTimer] = useState(0)

  const wakeServer = useCallback(async () => {
    setRetrying(true)
    setServerSleeping(false)
    try {
      const res = await getProfile()
      setUser(res.data)
      setLoading(false)
      setRetrying(false)
    } catch {
      setServerSleeping(true)
      setRetrying(false)
    }
  }, [setUser, setLoading])

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  // Timer to detect server sleep (after 12s of loading)
  useEffect(() => {
    if (!token || isAuthenticated) return

    const interval = setInterval(() => {
      setLoadTimer((prev) => {
        if (prev >= 12) {
          setServerSleeping(true)
          return prev
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [token, isAuthenticated])

  // If we have token but no auth, try to wake server
  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      wakeServer()
    }
  }, [token, isAuthenticated, isLoading, wakeServer])

  if (!token || (!isAuthenticated && isLoading) || serverSleeping || retrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          {serverSleeping ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
                <WifiOff className="h-8 w-8 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Serveur en veille</h2>
                <p className="text-sm text-muted-foreground">
                  Le serveur se réveille après une période d&apos;inactivité. Cela peut prendre
                  jusqu&apos;à 30 secondes.
                </p>
              </div>
              <button
                onClick={wakeServer}
                disabled={retrying}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {retrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Réessayer
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Chargement...</p>
                {loadTimer > 5 && (
                  <p className="text-xs text-muted-foreground animate-fade-in">
                    Le serveur peut mettre quelques secondes à se réveiller...
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
        >
          <Header title={title} />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
