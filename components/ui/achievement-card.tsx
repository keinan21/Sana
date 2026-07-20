"use client"

import * as React from "react"
import { LockOpen, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AchievementBadge } from "@/components/ui/achievement-badge"
import { AchievementList } from "@/components/ui/achievement-list"
import { Button } from "@/components/ui/button"

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
  achievedAt: string | null
}

interface AchievementCardProps extends React.HTMLAttributes<HTMLDivElement> {
  achievements: UserAchievement[]
  highlightedAchievements: UserAchievement[]
  badgeSize?: "sm" | "default" | "lg"
  lockedStyle?: "grayscale" | "silhouette" | "hidden"
  onAchievementClick?: (achievement: UserAchievement) => void
}

const AchievementCard = React.forwardRef<HTMLDivElement, AchievementCardProps>(
  (
    {
      className,
      achievements,
      highlightedAchievements,
      badgeSize = "default",
      lockedStyle = "grayscale",
      onAchievementClick,
      ...props
    },
    ref
  ) => {
    const unlockedCount = achievements.filter(
      (a) => a.achievedAt !== null
    ).length
    const totalCount = achievements.length

    return (
      <div
        ref={ref}
        className={cn("bg-card rounded-2xl border p-6 shadow-sm", className)}
        {...props}
      >
        <div className="text-center">
          <p className="text-7xl font-bold tracking-tight sm:text-8xl">
            {unlockedCount}
          </p>
          <div className="mt-1 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <LockOpen className="h-4 w-4 text-emerald-400" />
            Badges Unlocked
            <Badge variant="secondary" className="ml-1">
              {totalCount} total
            </Badge>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-center gap-4">
          {highlightedAchievements.slice(0, 3).map((achievement, index) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              badgeSize="sm"
              onAchievementClick={onAchievementClick}
              className={cn(
                "w-28 border-0 bg-transparent p-0 shadow-none hover:shadow-none",
                index === 1 ? "-translate-y-2" : "translate-y-1"
              )}
            />
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-primary text-sm font-medium">
              All Achievements
            </h3>
            <Button variant="link" size="sm" onClick={() => {}}>
              See all
            </Button>
          </div>
          <AchievementList
            achievements={achievements}
            badgeSize={badgeSize}
            lockedStyle={lockedStyle}
            onAchievementClick={onAchievementClick}
          />
        </div>
      </div>
    )
  }
)
AchievementCard.displayName = "AchievementCard"

export { AchievementCard }
export type { AchievementCardProps, Achievement, UserAchievement }
