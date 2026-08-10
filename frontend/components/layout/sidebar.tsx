'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Monitor,
  ChevronLeft,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/forms', label: 'Formulaires', icon: FileText },
  { href: '/profile', label: 'Profil', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, theme, setTheme } =
    useUIStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-3 font-semibold text-lg text-sidebar-foreground',
                sidebarCollapsed && 'lg:justify-center'
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="truncate">FormFlow</span>}
            </Link>

            {/* Close button (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Collapse button (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft
                className={cn(
                  'h-4 w-4 transition-transform',
                  sidebarCollapsed && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    sidebarCollapsed && 'lg:justify-center lg:px-2'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.href}>{linkContent}</div>
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            {/* Theme toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3',
                    sidebarCollapsed && 'lg:justify-center lg:px-2'
                  )}
                >
                  {themeIcon === Moon ? (
                    <Moon className="h-5 w-5" />
                  ) : themeIcon === Sun ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                  {!sidebarCollapsed && <span>Thème</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={sidebarCollapsed ? 'center' : 'end'}>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4 mr-2" /> Clair
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4 mr-2" /> Sombre
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4 mr-2" /> Système
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User info */}
            {user && !sidebarCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                'w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10',
                sidebarCollapsed && 'lg:justify-center lg:px-2'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!sidebarCollapsed && <span>Déconnexion</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
