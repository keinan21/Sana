"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface XpToastProps {
  xp: number
  reason?: string
  detail?: string
  levelName?: string
  xpToNext?: number
  onDismiss: () => void
}

export function XpToast({ xp, reason, detail, levelName, xpToNext, onDismiss }: XpToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 4000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDismiss])

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-white px-5 py-4 shadow-lg transition-all duration-300 max-w-sm",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <Sparkles className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-700">
          +{xp} XP
          {reason && <span className="font-normal text-emerald-600"> — {reason}</span>}
        </p>
        {detail && (
          <p className="text-xs text-emerald-600/80 truncate mt-0.5">{detail}</p>
        )}
        {levelName && xpToNext !== undefined && (
          <p className="text-xs text-emerald-500 mt-0.5">
            {xpToNext} XP to {levelName}
          </p>
        )}
      </div>
    </div>
  )
}
