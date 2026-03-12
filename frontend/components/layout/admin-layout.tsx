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
  const { isAuthenticated, isLoading, token } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()

  useEffect(() => {
    if (!token && !isLoading) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  if (!token || (!isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-foreground">Chargement...</p>
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
