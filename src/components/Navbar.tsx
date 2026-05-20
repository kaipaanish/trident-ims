'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PackagePlus,
  List,
  Database,
  Wheat,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/',              label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dispatch/new',  label: 'New Dispatch',   icon: PackagePlus },
  { href: '/dispatch',      label: 'All Dispatches', icon: List },
  { href: '/masters',       label: 'Master Data',    icon: Database },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/40">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Trident IMS</p>
            <p className="text-slate-500 text-xs">Seed Dispatch System</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-green-500" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-slate-600 text-xs">Dispatch Season 2026</p>
        <p className="text-slate-500 text-xs mt-0.5">v1.0.0 — Prototype</p>
      </div>
    </aside>
  )
}
