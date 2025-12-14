'use client'

import type { ReactNode } from 'react'
import { Shield } from 'lucide-react'

export default function InterstellarAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070816] to-black" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-600 blur-3xl" />
        <div className="absolute top-1/3 -right-48 h-[620px] w-[620px] rounded-full bg-cyan-600 blur-3xl" />
        <div className="absolute bottom-[-220px] left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="absolute inset-0 starfield pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-[spin_36s_linear_infinite]" />
        <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-[spin_22s_linear_infinite_reverse]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/15 shadow-[0_0_40px_rgba(99,102,241,0.25)]">
              <Shield className="h-6 w-6 text-white/90" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm text-white/70">{subtitle}</p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_10px_60px_rgba(0,0,0,0.55)]">
            <div className="p-6">{children}</div>
          </div>

          <style jsx global>{`
            .starfield {
              background-image:
                radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,.8), transparent 60%),
                radial-gradient(1px 1px at 140px 80px, rgba(255,255,255,.7), transparent 60%),
                radial-gradient(1px 1px at 80px 160px, rgba(255,255,255,.6), transparent 60%),
                radial-gradient(2px 2px at 220px 120px, rgba(255,255,255,.7), transparent 60%),
                radial-gradient(1px 1px at 300px 40px, rgba(255,255,255,.55), transparent 60%),
                radial-gradient(1px 1px at 360px 180px, rgba(255,255,255,.6), transparent 60%);
              background-size: 420px 240px;
              animation: drift 18s linear infinite;
            }
            @keyframes drift {
              from { transform: translate3d(0,0,0); }
              to { transform: translate3d(-420px, -240px, 0); }
            }
            @keyframes spin {
              from { transform: translate(-50%,-50%) rotate(0deg); }
              to { transform: translate(-50%,-50%) rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}
