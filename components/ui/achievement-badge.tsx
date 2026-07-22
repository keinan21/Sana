"use client"

import * as React from "react"
import {
  Trophy,
  Rocket,
  Target,
  Flame,
  Award,
  BadgeCheck,
  Crown,
  Zap,
  Footprints,
  Brain,
  Mountain,
  Shield,
  Flag,
  Timer,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Achievement {
  id: string
  name: string
  description?: string | null
  trigger: "metric" | "api" | "streak"
  badgeUrl?: string | null
  progress?: number
  rarity?: number
}

interface UserAchievement extends Achievement {
  /** ISO date when earned, or `null` if locked */
  achievedAt: string | null
}

interface AchievementBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  achievement: UserAchievement
  badgeSize?: "sm" | "default" | "lg" | "xl"
  onAchievementClick?: (achievement: UserAchievement) => void
}

const badgeSizeMap = {
  sm: "h-12 w-12",
  default: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const

const iconSizeMap = {
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const

const progressRingSizeMap = {
  sm: 72,
  default: 88,
  lg: 104,
  xl: 136,
} as const

function getCategoryFromId(id: string) {
  if (id === "first_step" || id === "ai_scholar" || id === "consistent_router") return "onboarding"
  if (id.startsWith("focused_")) return "focused"
  if (id.startsWith("consistent_")) return "consistent"
  if (id.startsWith("goal_breaker_")) return "goal_breaker"
  if (id.startsWith("quest_veteran_")) return "quest_veteran"
  if (id.startsWith("campaign_champ_")) return "campaign_champ"
  if (id.startsWith("speed_demon_")) return "speed_demon"
  return "onboarding"
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string; fill?: string }> = {
  onboarding: { icon: Rocket, color: "text-spark-blue", bg: "bg-spark-blue/10" },
  focused: { icon: Target, color: "text-amber-600", bg: "bg-amber-100", fill: "fill-amber-200" },
  consistent: { icon: Flame, color: "text-orange-500", bg: "bg-orange-100", fill: "fill-orange-200" },
  goal_breaker: { icon: Trophy, color: "text-amber-600", bg: "bg-amber-100", fill: "fill-amber-200" },
  quest_veteran: { icon: BadgeCheck, color: "text-eager-green", bg: "bg-storybook-green", fill: "fill-emerald-200" },
  campaign_champ: { icon: Crown, color: "text-purple-600", bg: "bg-purple-100", fill: "fill-purple-200" },
  speed_demon: { icon: Zap, color: "text-[#ff4b4b]", bg: "bg-red-100", fill: "fill-red-200" },
}

const AchievementBadge = React.forwardRef<
  HTMLDivElement,
  AchievementBadgeProps
>(
  (
    {
      className,
      achievement,
      badgeSize = "default",
      onAchievementClick,
      ...props
    },
    ref
  ) => {
    const isUnlocked = achievement.achievedAt !== null

    const hasProgress = isUnlocked && typeof achievement.progress === "number"
    const progress = hasProgress
      ? Math.min(100, Math.max(0, achievement.progress ?? 0))
      : 0
    const hasRarity = typeof achievement.rarity === "number"
    const rarity = hasRarity
      ? Math.min(100, Math.max(1, Math.round(achievement.rarity ?? 1)))
      : null
    const ringSize = progressRingSizeMap[badgeSize]
    const ringStrokeWidth = 4
    const ringRadius = (ringSize - ringStrokeWidth) / 2
    const ringCircumference = 2 * Math.PI * ringRadius
    const ringDashoffset =
      ringCircumference - (progress / 100) * ringCircumference

    const category = getCategoryFromId(achievement.id)
    const config = categoryConfig[category]
    const CategoryIcon = config.icon

    const statusLabel = isUnlocked ? "Earned" : "Locked"
    const itemLabel = `${achievement.name} - ${statusLabel}`

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              role={onAchievementClick ? "button" : "listitem"}
              aria-label={onAchievementClick ? itemLabel : undefined}
              tabIndex={onAchievementClick ? 0 : undefined}
              onClick={() => onAchievementClick?.(achievement)}
              onKeyDown={
                onAchievementClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onAchievementClick(achievement)
                      }
                    }
                  : undefined
              }
              className={cn(
                "bg-paper-white flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                onAchievementClick && "cursor-pointer",
                isUnlocked
                  ? "border-faded-gray shadow-[0_0_12px_-6px_hsl(43,80%,50%)]"
                  : "border-faded-gray opacity-50",
                className
              )}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: hasProgress ? `${ringSize}px` : undefined,
                  height: hasProgress ? `${ringSize}px` : undefined,
                }}
              >
                {hasProgress ? (
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${ringSize} ${ringSize}`}
                  >
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={ringRadius}
                      fill="none"
                      stroke="var(--primary)"
                      strokeLinecap="round"
                      strokeWidth={ringStrokeWidth}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashoffset}
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  </svg>
                ) : null}

                {achievement.badgeUrl ? (
                  <img
                    src={achievement.badgeUrl}
                    alt={`${achievement.name} badge - ${statusLabel}`}
                    className={cn(
                      badgeSizeMap[badgeSize],
                      "relative z-10 rounded-full object-cover",
                      !isUnlocked && "grayscale"
                    )}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={cn(
                      badgeSizeMap[badgeSize],
                      "relative z-10 flex items-center justify-center rounded-full",
                      isUnlocked
                        ? `${config.bg} ${config.color}`
                        : "bg-slate-100 text-slate-300"
                    )}
                  >
                    <CategoryIcon className={cn(iconSizeMap[badgeSize], isUnlocked && config.fill)} />
                  </div>
                )}
              </div>

              {rarity !== null ? (
                <span className="text-pencil-gray text-xs font-medium">
                  {rarity}% of users
                </span>
              ) : null}

              <span
                className={cn(
                  "text-center text-sm leading-tight font-bold",
                  isUnlocked ? "text-charcoal" : "text-pencil-gray"
                )}
              >
                {achievement.name}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-56">
            <p className="font-semibold">{achievement.name}</p>
            {achievement.description && (
              <p className="mt-0.5 text-muted-foreground">{achievement.description}</p>
            )}
            {!isUnlocked && (
              <p className="mt-1 text-xs italic text-muted-foreground/60">
                {achievement.description ? "Complete to unlock this achievement" : "Still locked"}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)
AchievementBadge.displayName = "AchievementBadge"

export { AchievementBadge }
export type { AchievementBadgeProps, Achievement, UserAchievement }
