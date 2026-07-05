"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface XpToastProps {
  xp: number
  onDismiss: () => void
}

export function XpToast({ xp, onDismiss }: XpToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 2000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDismiss])

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-md transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <Sparkles className="h-4 w-4" />
      +{xp} XP
    </div>
  )
}
