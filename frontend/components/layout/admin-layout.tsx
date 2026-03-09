'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useUIStore } from '@/stores'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, setLoading, token } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [token, isLoading, router, setLoading])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Chargement...</p>
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
