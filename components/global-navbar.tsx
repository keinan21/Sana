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
    <header className="sticky top-0 z-50 w-full bg-paper-white border-b-2 border-faded-gray">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
        <a
          href="/dashboard"
          className="font-feather text-xl font-black tracking-[-0.02em] text-eager-green transition-colors hover:opacity-80"
        >
          sana
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "inline-flex h-9 items-center rounded-xl border-2 px-3 text-nav-label font-bold uppercase tracking-[0.0530em] transition-colors",
                isActive(link.href)
                  ? "border-eager-green bg-storybook-green text-eager-green"
                  : "border-faded-gray bg-transparent text-pencil-gray hover:border-charcoal hover:text-charcoal"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <UserButton />

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-faded-gray text-pencil-gray hover:border-charcoal hover:text-charcoal transition-colors md:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t-2 border-faded-gray bg-paper-white md:hidden">
          <nav className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex h-10 items-center rounded-xl border-2 px-3 text-nav-label font-bold uppercase tracking-[0.0530em] transition-colors",
                  isActive(link.href)
                    ? "border-eager-green bg-storybook-green text-eager-green"
                    : "border-faded-gray text-pencil-gray hover:border-charcoal hover:text-charcoal"
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
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-eager-green px-4 text-nav-label font-bold uppercase tracking-[0.0530em] text-paper-white border-2 border-eager-green transition-colors hover:bg-[#4db802]"
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
