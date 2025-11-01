'use client'

import * as React from 'react'
import { useLocalization } from '@/hooks/useLocalization'

// Dacă ai shadcn/ui: decomentează și folosește varianta UI de mai jos.
// import { Button } from '@/components/ui/button'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'

type Lang = 'en' | 'ro'

const LANGS: Array<{ code: Lang; label: string; flag: React.ReactNode }> = [
  { code: 'en', label: 'English', flag: <FlagEN /> },
  { code: 'ro', label: 'Română', flag: <FlagRO /> },
]

export function LanguageSwitcher({ compact = true }: { compact?: boolean }) {
  const { language, changeLanguage, isLoading } = useLocalization()
  const [open, setOpen] = React.useState(false)

  // ── Variantă fără shadcn (fallback enterprise, 0 deps) ──
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {LANGS.find(l => l.code === language)?.flag}
        <span className="font-medium">
          {LANGS.find(l => l.code === language)?.label ?? language.toUpperCase()}
        </span>
        <svg className="h-4 w-4 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.175l3.71-3.945a.75.75 0 1 1 1.08 1.04l-4.24 4.51a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-lg"
        >
          {LANGS.map(({ code, label, flag }) => {
            const active = code === language
            return (
              <li key={code}>
                <button
                  role="option"
                  aria-selected={active}
                  disabled={isLoading || active}
                  onClick={() => {
                    setOpen(false)
                    if (!active) changeLanguage(code)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 focus:bg-white/10 ${active ? 'opacity-60 cursor-default' : ''}`}
                >
                  {flag}
                  <span>{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ───────────────── Flags (inline SVG, fără rețele externe) ───────────────── */

function FlagEN() {
  return (
    <svg aria-hidden viewBox="0 0 640 480" className="h-4 w-6 rounded-sm">
      <defs><clipPath id="a"><path d="M0 0h640v480H0z"/></clipPath></defs>
      <g clipPath="url(#a)">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path fill="#FFF" d="M75 0l222 170L521 0h119v62L418 240l222 178v62H521L319 310 117 480H0v-62l222-178L0 62V0h75z"/>
        <path fill="#C8102E" d="M424 280l216 160v40L390 280h34zm-184-40L24 480H0v-32l216-168h24zM640 0v3L400 186h-34L640 0zM0 0l240 180h-34L0 31V0z"/>
        <path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z"/>
        <path fill="#C8102E" d="M0 192v96h640v-96H0zM272 0v480h96V0h-96z"/>
      </g>
    </svg>
  )
}

function FlagRO() {
  return (
    <svg aria-hidden viewBox="0 0 3 2" className="h-4 w-6 rounded-sm">
      <path fill="#002B7F" d="M0 0h1v2H0z"/><path fill="#FCD116" d="M1 0h1v2H1z"/><path fill="#CE1126" d="M2 0h1v2H2z"/>
    </svg>
  )
}

/* ─────────────────────────────
   Variantă cu shadcn/ui (opțional):

export function LanguageSwitcher({ compact = true }: { compact?: boolean }) {
  const { language, changeLanguage, isLoading } = useLocalization()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'sm' : 'default'} className="inline-flex items-center gap-2">
          {language === 'ro' ? <FlagRO/> : <FlagEN/>}
          <span className="hidden sm:inline">{language === 'ro' ? 'Română' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGS.map(({ code, label, flag }) => {
          const active = code === language
          return (
            <DropdownMenuItem
              key={code}
              disabled={isLoading || active}
              onClick={() => !active && changeLanguage(code)}
              className="flex items-center gap-2"
            >
              {flag} <span>{label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
*/
