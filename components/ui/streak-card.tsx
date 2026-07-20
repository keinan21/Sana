"use client"

import * as React from "react"
import {
  CheckCircle2,
  ChevronDown,
  Flame,
  RefreshCcw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  StreakCalendar,
  type StreakPeriod,
} from "@/components/ui/streak-calendar"

interface StreakCardProps extends React.HTMLAttributes<HTMLDivElement> {
  streak: StreakPeriod[]
  currentStreak: number
  longestStreak: number
  total: number
  title?: string
  actionLabel?: string
  onActionClick?: () => void
  showHowItWorks?: boolean
  howItWorksTitle?: string
  howItWorksItems?: string[]
  defaultHowItWorksOpen?: boolean
}

const StreakCard = React.forwardRef<HTMLDivElement, StreakCardProps>(
  (
    {
      className,
      streak,
      currentStreak,
      longestStreak,
      total,
      title = "Learning Rhythm",
      actionLabel = "View Details",
      onActionClick,
      showHowItWorks = true,
      howItWorksTitle = "How your rhythm works?",
      howItWorksItems = [
        "Complete at least one task each day to build your learning rhythm.",
        "Your rhythm grows with every active day — no pressure to be perfect.",
        "Skipping a day pauses your rhythm, it never resets. You can always pick up where you left off.",
      ],
      defaultHowItWorksOpen = false,
      ...props
    },
    ref
  ) => {
    const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(
      defaultHowItWorksOpen
    )
    const howItWorksContentId = React.useId()

    return (
      <section
        ref={ref}
        aria-label="Learning rhythm summary"
        className={cn("bg-card rounded-2xl border p-6 shadow-sm", className)}
        {...props}
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="text-primary h-6 w-6" aria-hidden="true" />
            <h3 className="text-2xl leading-none font-semibold">{title}</h3>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={onActionClick}
            aria-label={actionLabel}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {actionLabel}
          </Button>
        </header>

        <p className="mb-4 text-5xl leading-none font-semibold tracking-tight">
          {currentStreak}
          <span className="text-muted-foreground ml-2 text-2xl font-medium">
            days
          </span>
        </p>

        <StreakCalendar
          streak={streak}
          view="week"
          startOfWeek={1}
          className="max-w-none"
        />

        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed pt-4"
          aria-label="Streak stats"
        >
          <div>
            <p className="text-muted-foreground text-sm">Longest Streak</p>
            <p className="text-3xl leading-tight font-semibold">
              {longestStreak}
              <span className="ml-1 text-2xl font-medium">days</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Total</p>
            <p className="text-3xl leading-tight font-semibold">{total}</p>
          </div>
        </div>

        {showHowItWorks && (
          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              className="bg-muted flex w-full items-center justify-between rounded-xl px-4 py-3 text-left"
              onClick={() => setIsHowItWorksOpen((prev) => !prev)}
              aria-expanded={isHowItWorksOpen}
              aria-controls={howItWorksContentId}
            >
              <span className="text-lg font-semibold">{howItWorksTitle}</span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground h-5 w-5 transition-transform",
                  isHowItWorksOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {isHowItWorksOpen && (
              <div id={howItWorksContentId} className="space-y-4 px-2 pt-4">
                {howItWorksItems.map((item, index) => {
                  const Icon =
                    index === 0
                      ? CheckCircle2
                      : index === 1
                        ? Flame
                        : RefreshCcw
                  return (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-3"
                    >
                      <Icon
                        className="text-primary mt-0.5 h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-muted-foreground text-lg leading-snug">
                        {item}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>
    )
  }
)
StreakCard.displayName = "StreakCard"

export { StreakCard }
export type { StreakCardProps }
