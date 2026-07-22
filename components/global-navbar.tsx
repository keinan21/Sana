"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Menu, Sparkles, X, KeyRound, LayoutDashboard, Compass, Settings } from "lucide-react"
import { ApiKeyDialog, getApiKey } from "@/components/ui/api-key-dialog"
import { AnimatePresence, motion } from "framer-motion"

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Campaigns", href: "/campaigns", icon: Compass },
  { label: "Settings", href: "/settings", icon: Settings },
] as const

export default function GlobalNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    setHasKey(!!getApiKey())
  }, [showApiKeyDialog])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile()
    }
    if (mobileOpen) window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mobileOpen, closeMobile])

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
          <button
            type="button"
            onClick={() => setShowApiKeyDialog(true)}
            className="relative inline-flex size-9 items-center justify-center rounded-xl border-2 border-faded-gray text-pencil-gray hover:border-charcoal hover:text-charcoal transition-colors"
            aria-label="API Key"
          >
            <KeyRound className="size-4" />
            <span
              className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-paper-white ${
                hasKey ? "bg-eager-green" : "bg-[#ff4b4b]"
              }`}
            />
          </button>

          <UserButton />

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-faded-gray text-pencil-gray hover:border-charcoal hover:text-charcoal transition-colors md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            />

            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-paper-white shadow-2xl flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-5 h-14 border-b-2 border-faded-gray">
                <span className="font-feather text-xl font-black tracking-[-0.02em] text-eager-green">
                  sana
                </span>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={closeMobile}
                  className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-faded-gray text-pencil-gray hover:border-charcoal hover:text-charcoal transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-faded-gray">
                <UserButton />
                <p className="text-xs text-pencil-gray font-medium">Signed in</p>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={closeMobile}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-xl border-2 px-4 text-body font-bold transition-colors",
                        isActive(link.href)
                          ? "border-eager-green bg-storybook-green text-eager-green"
                          : "border-transparent text-charcoal hover:border-faded-gray hover:bg-slate-50"
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      {link.label}
                    </a>
                  )
                })}

                <div className="my-3 h-px bg-faded-gray" />

                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    setShowApiKeyDialog(true)
                  }}
                  className="flex h-12 w-full items-center gap-3 rounded-xl border-2 border-faded-gray px-4 text-body font-bold text-charcoal transition-colors hover:border-charcoal"
                >
                  <KeyRound className="size-5 shrink-0" />
                  API Key
                  <span
                    className={cn(
                      "ml-auto size-2.5 rounded-full",
                      hasKey ? "bg-eager-green" : "bg-[#ff4b4b]"
                    )}
                  />
                </button>
              </nav>

              <div className="px-3 pb-5 pt-2 border-t-2 border-faded-gray">
                <button
                  type="button"
                  onClick={() => {
                    closeMobile()
                    router.push("/campaign/create")
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-eager-green px-4 text-body font-bold text-paper-white border-2 border-eager-green transition-colors hover:bg-[#4db802]"
                >
                  <Sparkles className="size-5" />
                  New Campaign
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
    </header>
  )
}
