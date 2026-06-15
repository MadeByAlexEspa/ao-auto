'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/lib/actions/auth'

const NAV_LINKS = [
  { href: '/', label: 'Tableau de bord', icon: HomeIcon },
  { href: '/boamp', label: "Appels d'offre", icon: ListIcon },
  { href: '/settings', label: 'Paramètres', icon: SettingsIcon },
]

const STORAGE_KEY = 'ao-auto:sidebar-collapsed'

export function AppShell({
  userEmail,
  children,
}: {
  userEmail?: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="flex min-h-screen">
      <aside
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center h-16 px-3 border-b border-slate-200 gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
              AO
            </span>
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight text-slate-900 truncate">ao-auto</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 py-3">
          {NAV_LINKS.map(link => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="shrink-0 h-5 w-5" />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {userEmail && (
          <div className="border-t border-slate-200 p-2">
            {!collapsed && (
              <p className="px-3 pt-2 pb-1 text-xs text-slate-400 truncate">{userEmail}</p>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                title={collapsed ? 'Déconnexion' : undefined}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <LogoutIcon className="shrink-0 h-5 w-5" />
                {!collapsed && <span>Déconnexion</span>}
              </button>
            </form>
          </div>
        )}
      </aside>

      <div suppressHydrationWarning className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ${collapsed ? 'pl-16' : 'pl-60'}`}>
        {children}
      </div>
    </div>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M8 6h12M8 12h12M8 18h12" strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronIcon({ className, collapsed }: { className?: string; collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`${className ?? ''} transition-transform ${collapsed ? 'rotate-180' : ''}`}>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
