"use client"

import { useEffect, useState } from "react"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSoundEffects } from "@/lib/use-sound-effects"

interface MilestoneToastProps {
  percentage: number
  levelName: string
  nextLevelName: string
  onDismiss: () => void
}

const MILESTONE_MESSAGES: Record<number, string> = {
  25: "You're building momentum!",
  50: "Halfway there — keep going!",
  75: "Almost there!",
}

export function MilestoneToast({ percentage, levelName, nextLevelName, onDismiss }: MilestoneToastProps) {
  const [visible, setVisible] = useState(false)
  const { playMilestone } = useSoundEffects()

  useEffect(() => {
    playMilestone()
  }, [playMilestone])

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 5000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [onDismiss])

  const message = MILESTONE_MESSAGES[percentage] ?? "Keep up the great work!"

  return (
    <div
      className={cn(
        "fixed top-24 right-4 md:bottom-24 md:right-6 md:top-auto z-50 flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-white px-5 py-4 shadow-lg transition-all duration-300 max-w-sm",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Target className="h-5 w-5 text-amber-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-amber-800">
          {percentage}% to {nextLevelName}
        </p>
        <p className="text-xs text-amber-700/80 mt-0.5">{message}</p>
      </div>
    </div>
  )
}
