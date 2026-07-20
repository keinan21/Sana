"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getDashboardData } from "@/app/actions/gamification"
import { getUserCampaigns } from "@/app/actions/db-campaigns"
import { getLevelName } from "@/lib/levels"
import { PointsAwards } from "@/components/ui/points-awards"
import { AchievementGrid } from "@/components/ui/achievement-grid"
import { StreakCard } from "@/components/ui/streak-card"
import { StreakCalendar } from "@/components/ui/streak-calendar"
import { PointsLevelsTimeline } from "@/components/ui/points-levels-timeline"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import GlobalNavbar from "@/components/global-navbar"
import { ApiKeyDialog } from "@/components/ui/api-key-dialog"
import {
  ArrowRight,
  Flame,
  KeyRound,
  Sparkles,
  Trophy,
  Zap,
  Target,
  LayoutDashboard,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LearningCircuitData } from "@/lib/types"

const PointsChart = dynamic(() => import("@/components/ui/points-chart").then((m) => m.PointsChart), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-xl bg-slate-100" />,
})

interface DashboardCampaign {
  id: string
  title: string
  targetDescription: string
  totalEstimatedWeeks: number
  circuitData: unknown
  createdAt: string
}

interface DashboardData {
  totalXp: number
  level: number
  levelName: string
  xpToNext: number
  streakCount: number
  lastTaskDate: string | null
  chartData: { date: string; total: number; change: number }[]
  achievements: {
    id: string
    name: string
    description: string
    trigger: "metric" | "api" | "streak"
    achievedAt: string | null
  }[]
  recentAwards: {
    id: string
    awarded: number
    date: string
    total: number
    trigger: { id: string; type: string; points: number; metricName?: string | null }
  }[]
}

const TABS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "progress", label: "Progress", Icon: TrendingUp },
  { id: "achievements", label: "Achievements", Icon: Trophy },
  { id: "activity", label: "Activity", Icon: Activity },
] as const

type TabId = (typeof TABS)[number]["id"]

function calcCampaignProgress(circuitData: unknown): {
  completed: number
  total: number
  percentage: number
} {
  try {
    const data = circuitData as LearningCircuitData
    if (!data?.moduls?.length) return { completed: 0, total: 0, percentage: 0 }
    let total = 0
    let completed = 0
    for (const modul of data.moduls) {
      if (!modul.todos) continue
      for (const todo of modul.todos) {
        total++
        if (todo.isDone) completed++
      }
    }
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  } catch {
    return { completed: 0, total: 0, percentage: 0 }
  }
}

function findNearestDeadlineQuest(circuitData: unknown): { title: string; daysLeft: number; overdue: boolean } | null {
  try {
    const data = circuitData as LearningCircuitData
    if (!data?.moduls?.length) return null
    const now = Date.now()
    let nearest: { title: string; daysLeft: number; overdue: boolean } | null = null
    let nearestDeadline = Infinity
    for (const modul of data.moduls) {
      if (modul.done || !modul.createdAt || modul.idealDaysToComplete <= 0) continue
      const created = new Date(modul.createdAt).getTime()
      const deadline = created + modul.idealDaysToComplete * 86400000
      if (deadline < nearestDeadline) {
        nearestDeadline = deadline
        const daysLeft = Math.ceil((deadline - now) / 86400000)
        nearest = { title: modul.title, daysLeft, overdue: daysLeft < 0 }
      }
    }
    return nearest
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  useEffect(() => {
    document.title = "Dashboard | Sana"
    Promise.all([getDashboardData(), getUserCampaigns()]).then(([dashRes, campRes]) => {
      if (dashRes.success && dashRes.data) {
        setData(dashRes.data)
      }
      if (campRes.success && campRes.data) {
        setCampaigns(campRes.data)
      }
      setLoading(false)
    })
  }, [])

  const totalTasks = useMemo(
    () =>
      campaigns.reduce((sum, c) => {
        try {
          const cd = c.circuitData as LearningCircuitData
          if (!cd?.moduls) return sum
          return sum + cd.moduls.flatMap((m) => m.todos || []).length
        } catch {
          return sum
        }
      }, 0),
    [campaigns]
  )

  const completedTasks = useMemo(
    () =>
      campaigns.reduce((sum, c) => {
        try {
          const cd = c.circuitData as LearningCircuitData
          if (!cd?.moduls) return sum
          return sum + cd.moduls.flatMap((m) => m.todos || []).filter((t) => t.isDone).length
        } catch {
          return sum
        }
      }, 0),
    [campaigns]
  )

  const totalCampaignQuests = useMemo(
    () =>
      campaigns.reduce((sum, c) => {
        try {
          const cd = c.circuitData as LearningCircuitData
          if (!cd?.moduls) return sum
          return sum + cd.moduls.length
        } catch {
          return sum
        }
      }, 0),
    [campaigns]
  )

  const verifiedQuests = useMemo(
    () =>
      campaigns.reduce((sum, c) => {
        try {
          const cd = c.circuitData as LearningCircuitData
          if (!cd?.moduls) return sum
          return sum + cd.moduls.filter((m) => m.done).length
        } catch {
          return sum
        }
      }, 0),
    [campaigns]
  )

  const completedCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        try {
          const cd = c.circuitData as LearningCircuitData
          return cd?.moduls?.every((m) => m.done)
        } catch {
          return false
        }
      }).length,
    [campaigns]
  )

  const streakPeriods = useMemo(() => {
    if (!data?.lastTaskDate) return []
    const periods: { periodStart: string; periodEnd: string }[] = []
    if (data.streakCount > 0) {
      const lastDate = new Date(data.lastTaskDate)
      const startDate = new Date(lastDate)
      startDate.setDate(startDate.getDate() - data.streakCount + 1)
      periods.push({
        periodStart: startDate.toISOString().split("T")[0],
        periodEnd: lastDate.toISOString().split("T")[0],
      })
    }
    return periods
  }, [data?.lastTaskDate, data?.streakCount])

  const levelTimelineData = useMemo(() => {
    const levels: { id: string; name: string; points: number }[] = []
    for (let i = 1; i <= 10; i++) {
      levels.push({
        id: `level-${i}`,
        name: getLevelName(i),
        points: (i - 1) * 500,
      })
    }
    return levels
  }, [])

  const unlockedCount = useMemo(
    () => data?.achievements.filter((a) => a.achievedAt !== null).length ?? 0,
    [data?.achievements]
  )

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-paper-white text-pencil-gray flex items-center justify-center font-mono text-sm">
        Loading dashboard...
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full bg-paper-white text-charcoal overflow-x-hidden">
      <GlobalNavbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal truncate">Dashboard</h1>
            <p className="text-xs sm:text-sm text-pencil-gray mt-0.5 sm:mt-1">
              Your learning journey at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowApiKeyDialog(true)}
              className="border-2 border-faded-gray text-pencil-gray hover:text-charcoal hover:bg-muted text-xs px-2.5 sm:px-3 py-1.5 sm:py-2"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">API Key</span>
              <span className="sm:hidden">Key</span>
            </Button>
            <Button
              onClick={() => router.push("/campaign/create")}
              className="bg-eager-green hover:bg-[#4db802] text-white font-semibold text-xs px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-eager-green"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">New Campaign</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex gap-1 mb-6 border-b-2 border-faded-gray">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-[2px] transition-colors",
                activeTab === id
                  ? "text-eager-green border-eager-green"
                  : "text-pencil-gray border-transparent hover:text-charcoal hover:border-pencil-gray"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* STATS ROW — visible on all tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#ce82ff]/20">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#ce82ff]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Level</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-charcoal truncate">
                {data?.level ?? "—"} <span className="text-sm font-medium text-pencil-gray">{data?.levelName}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-storybook-green">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-eager-green" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Total XP</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-charcoal truncate">{data?.totalXp ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff4b4b]/20">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff4b4b]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Learning Rhythm</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-charcoal truncate">{data?.streakCount ?? 0} day run</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-spark-blue/20">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-spark-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Completed</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-charcoal truncate">{completedCampaigns}/{campaigns.length}</p>
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* XP PROGRESS */}
            <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-3">
                <p className="text-xs sm:text-sm font-bold text-charcoal truncate">
                  XP Progress — Level {data?.level ?? 1} {data?.levelName}
                </p>
                <p className="text-[11px] sm:text-xs font-mono text-pencil-gray whitespace-nowrap">
                  {data?.xpToNext ?? 0} XP to {data?.levelName ?? getLevelName((data?.level ?? 1) + 1)}
                </p>
              </div>
              <Progress
                value={data ? ((data.totalXp % 500) / 500) * 100 : 0}
                className="h-2 bg-muted [&>div]:bg-eager-green"
              />
            </div>

            {/* RECENT CAMPAIGNS */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-charcoal">Active Campaigns</h2>
                <Link
                  href="/campaigns"
                  className="text-xs font-bold text-spark-blue hover:text-[#1590d0] inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {campaigns.length === 0 ? (
                <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-storybook-green">
                      <Target className="h-6 w-6 text-eager-green" />
                    </div>
                    <div>
                      <p className="font-bold text-charcoal">No campaigns yet</p>
                      <p className="text-xs text-pencil-gray mt-1">
                        Break your first big goal into manageable steps.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/campaign/create")}
                      className="bg-eager-green hover:bg-[#4db802] text-white font-bold border-2 border-eager-green mt-2"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Campaign
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.slice(0, 2).map((c) => {
                    const progress = calcCampaignProgress(c.circuitData)
                    return (
                      <Link key={c.id} href={`/campaign/${c.id}`}>
                        <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 hover:border-charcoal transition-colors cursor-pointer h-full flex flex-col">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">
                              {c.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-pencil-gray text-[10px] px-2 border-2 border-faded-gray"
                            >
                              {c.totalEstimatedWeeks}w
                            </Badge>
                          </div>
                          <p className="text-xs text-pencil-gray line-clamp-2 mb-4 flex-1">
                            {c.targetDescription}
                          </p>
                          {(() => {
                            const nearest = findNearestDeadlineQuest(c.circuitData)
                            if (!nearest) return null
                            return (
                              <div className={`flex items-center gap-1.5 mb-3 text-[10px] ${nearest.overdue ? 'text-destructive' : 'text-[#ff9600]'}`}>
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate text-pencil-gray">{nearest.title}</span>
                                <span className="font-bold shrink-0">
                                  {nearest.overdue ? `${Math.abs(nearest.daysLeft)}d overdue` : `${nearest.daysLeft}d left`}
                                </span>
                              </div>
                            )
                          })()}
                          <div className="space-y-2 mt-auto">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-pencil-gray">Progress</span>
                              <span className="text-eager-green font-mono font-bold">
                                {progress.percentage}%
                              </span>
                            </div>
                            <Progress
                              value={progress.percentage}
                              className="h-1.5 bg-muted [&>div]:bg-eager-green"
                            />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* QUICK STATS BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 space-y-2">
                <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Tasks</p>
                <p className="text-2xl sm:text-3xl font-bold text-charcoal">
                  {completedTasks}
                  <span className="text-base font-medium text-pencil-gray">/{totalTasks}</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 space-y-2">
                <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Quests Verified</p>
                <p className="text-2xl sm:text-3xl font-bold text-charcoal">
                  {verifiedQuests}
                  <span className="text-base font-medium text-pencil-gray">/{totalCampaignQuests}</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 space-y-2">
                <p className="text-[10px] sm:text-xs font-bold text-pencil-gray uppercase tracking-wider">Achievements</p>
                <p className="text-2xl sm:text-3xl font-bold text-charcoal">
                  {unlockedCount}
                  <span className="text-base font-medium text-pencil-gray">/{data?.achievements.length ?? 0}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* STREAK CARD */}
            <div className="space-y-6">
              <StreakCard
                streak={streakPeriods}
                currentStreak={data?.streakCount ?? 0}
                longestStreak={data?.streakCount ?? 0}
                total={data?.totalXp ?? 0}
                showHowItWorks={false}
              />
            </div>

            {/* WEEKLY CALENDAR */}
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
                <h3 className="text-sm font-bold text-charcoal mb-4">This Week</h3>
                <StreakCalendar
                  streak={streakPeriods as never[]}
                  view="week"
                  startOfWeek={1}
                />
              </div>
            </div>

            {/* LEVEL TIMELINE — full width */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
                <h3 className="text-sm font-bold text-charcoal mb-4">Level Journey</h3>
                <PointsLevelsTimeline
                  levels={levelTimelineData}
                  currentPoints={data?.totalXp}
                  currentLevelLabel={data?.levelName}
                />
              </div>
            </div>

            {/* PROGRESS SUMMARY */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5">
                <h3 className="text-sm font-bold text-charcoal mb-4">Progress Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-pencil-gray">Tasks</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-charcoal">{completedTasks}</p>
                      <p className="text-sm text-pencil-gray mb-0.5">/ {totalTasks}</p>
                    </div>
                    <Progress
                      value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}
                      className="h-1.5 bg-muted [&>div]:bg-eager-green"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-pencil-gray">Quests Verified</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-charcoal">{verifiedQuests}</p>
                      <p className="text-sm text-pencil-gray mb-0.5">/ {totalCampaignQuests}</p>
                    </div>
                    <Progress
                      value={totalCampaignQuests > 0 ? (verifiedQuests / totalCampaignQuests) * 100 : 0}
                      className="h-1.5 bg-muted [&>div]:bg-eager-green"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-pencil-gray">Campaigns</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-charcoal">{completedCampaigns}</p>
                      <p className="text-sm text-pencil-gray mb-0.5">/ {campaigns.length}</p>
                    </div>
                    <Progress
                      value={campaigns.length > 0 ? (completedCampaigns / campaigns.length) * 100 : 0}
                      className="h-1.5 bg-muted [&>div]:bg-eager-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-charcoal">Achievements</h2>
                <p className="text-sm text-pencil-gray mt-0.5">
                  {unlockedCount} / {data?.achievements.length ?? 0} unlocked
                </p>
              </div>
            </div>

            {data?.achievements && data.achievements.length > 0 ? (
              <AchievementGrid
                achievements={data.achievements.map((a) => ({
                  id: a.id,
                  name: a.name,
                  description: a.description,
                  trigger: a.trigger,
                  achievedAt: a.achievedAt,
                }))}
                columns={4}
                gap="lg"
              />
            ) : (
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-12 text-center">
                <Trophy className="h-12 w-12 text-faded-gray mx-auto mb-3" />
                <p className="font-bold text-charcoal">No achievements yet</p>
                <p className="text-xs text-pencil-gray mt-1">
                  Complete tasks and verify quests to earn your first badge.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* POINTS CHART */}
            {data?.chartData && data.chartData.length > 0 && (
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-charcoal">Points This Week</h3>
                <PointsChart
                  data={data.chartData}
                  className="[&_.bar-fill]:fill-eager-green [&_.bar-track]:fill-muted [&_.label]:text-pencil-gray"
                />
              </div>
            )}

            {/* RECENT AWARDS */}
            {data?.recentAwards && data.recentAwards.length > 0 && (
              <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-charcoal">Recent Awards</h3>
                <PointsAwards
                  awards={data.recentAwards}
                  className="[&_.text-muted-foreground]:text-pencil-gray [&_.text-foreground]:text-charcoal [&_.text-success]:text-eager-green"
                />
              </div>
            )}

            {/* EMPTY STATE */}
            {(!data?.chartData || data.chartData.length === 0) && (!data?.recentAwards || data.recentAwards.length === 0) && (
              <div className="lg:col-span-2 rounded-xl border-2 border-faded-gray bg-paper-white p-12 text-center">
                <Activity className="h-12 w-12 text-faded-gray mx-auto mb-3" />
                <p className="font-bold text-charcoal">No activity yet</p>
                <p className="text-xs text-pencil-gray mt-1">
                  Start working on your campaigns to see your activity here.
                </p>
              </div>
            )}
          </div>
        )}

        <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      </div>
    </main>
  )
}
