"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Menu, Sparkles, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Campaigns", href: "/campaigns" },
] as const

export default function GlobalNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (pathname === "/") return null
  if (!isSignedIn) return null

  const isActive = (href: string) => {
    if (href === pathname) return true
    if (href !== "/dashboard" && pathname.startsWith(href)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-slate-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
        <a
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-600 transition-colors"
        >
          sana
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-emerald-700 bg-emerald-50 border-2 border-emerald-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => router.push("/campaign/create")}
            className="ml-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white border-2 border-emerald-700 hover:bg-emerald-500 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New Campaign
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <UserButton />

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t-2 border-slate-200 bg-white md:hidden">
          <nav className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-emerald-700 bg-emerald-50 border-2 border-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                router.push("/campaign/create")
              }}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white border-2 border-emerald-700 hover:bg-emerald-500 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              New Campaign
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
