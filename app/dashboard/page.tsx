"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getDashboardData } from "@/app/actions/gamification"
import { getUserCampaigns } from "@/app/actions/db-campaigns"
import { PointsBadge } from "@/components/ui/points-badge"
import { PointsChart } from "@/components/ui/points-chart"
import { PointsAwards } from "@/components/ui/points-awards"
import { AchievementBadge } from "@/components/ui/achievement-badge"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import GlobalNavbar from "@/components/global-navbar"
import { ApiKeyDialog } from "@/components/ui/api-key-dialog"
import {
  ArrowRight,
  Flame,
  KeyRound,
  Lock,
  Plus,
  Sparkles,
  Trophy,
  Zap,
  Target,
} from "lucide-react"
import type { LearningCircuitData } from "@/lib/types"

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

function add(a: number, b: number): number {
  return a + b
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-500 flex items-center justify-center font-mono text-sm">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <GlobalNavbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Your learning journey at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApiKeyDialog(true)}
              className="border-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs px-3 py-2"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              API Key
            </Button>
            <Button
              onClick={() => router.push("/campaign/create")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 border-2 border-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border-2 border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Zap className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Level</p>
              <p className="text-2xl font-bold text-slate-900">{data?.level ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Trophy className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total XP</p>
              <p className="text-2xl font-bold text-slate-900">{data?.totalXp ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <Flame className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Streak</p>
              <p className="text-2xl font-bold text-slate-900">{data?.streakCount ?? 0} days</p>
            </div>
          </div>

          <div className="rounded-xl border-2 border-slate-200 bg-white p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100">
              <Target className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedCampaigns}/{campaigns.length}</p>
            </div>
          </div>
        </div>

        {/* XP PROGRESS */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">
              XP Progress — Level {data?.level ?? 1}
            </p>
            <p className="text-xs font-mono text-slate-500">
              {data?.xpToNext ?? 0} XP to next level
            </p>
          </div>
          <Progress
            value={data ? ((data.totalXp % 500) / 500) * 100 : 0}
            className="h-2 bg-slate-100 [&>div]:bg-emerald-500"
          />
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CAMPAIGNS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Active Campaigns
              </h2>
              <Link
                href="/campaigns"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-500 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border-2 border-slate-200 bg-white p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">No campaigns yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Break your first big goal into manageable steps.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/campaign/create")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border-2 border-emerald-700 mt-2"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Campaign
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.slice(0, 4).map((c) => {
                  const progress = calcCampaignProgress(c.circuitData)
                  return (
                    <Link key={c.id} href={`/campaign/${c.id}`}>
                      <div className="rounded-xl border-2 border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors cursor-pointer h-full flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                            {c.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="shrink-0 text-slate-500 text-[10px] px-2 border-2 border-slate-200"
                          >
                            {c.totalEstimatedWeeks}w
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                          {c.targetDescription}
                        </p>
                        <div className="space-y-2 mt-auto">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-emerald-600 font-mono font-semibold">
                              {progress.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={progress.percentage}
                            className="h-1.5 bg-slate-100 [&>div]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* QUICK STATS */}
            <div className="rounded-xl border-2 border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Progress Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tasks</span>
                  <span className="text-slate-900 font-mono font-semibold">
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Quests Verified</span>
                  <span className="text-slate-900 font-mono font-semibold">
                    {verifiedQuests}/{totalCampaignQuests}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Campaigns</span>
                  <span className="text-slate-900 font-mono font-semibold">
                    {completedCampaigns}/{campaigns.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ACHIEVEMENTS */}
            <div className="rounded-xl border-2 border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {data?.achievements && data.achievements.length > 0 ? (
                  data.achievements.map((a) => (
                    <AchievementBadge key={a.id} achievement={a} />
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No achievements yet.</p>
                )}
              </div>
            </div>

            {/* POINTS CHART */}
            {data?.chartData && data.chartData.length > 0 && (
              <div className="rounded-xl border-2 border-slate-200 bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Points This Week</h3>
                <PointsChart
                  data={data.chartData}
                  className="[&_.bar-fill]:fill-emerald-500 [&_.bar-track]:fill-slate-100 [&_.label]:text-slate-500"
                />
              </div>
            )}

            {/* RECENT AWARDS */}
            {data?.recentAwards && data.recentAwards.length > 0 && (
              <div className="rounded-xl border-2 border-slate-200 bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Recent Awards</h3>
                <PointsAwards
                  awards={data.recentAwards}
                  className="[&_.text-muted-foreground]:text-slate-500 [&_.text-foreground]:text-slate-900 [&_.text-success]:text-emerald-600"
                />
              </div>
            )}
          </div>
        </div>

        <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      </div>
    </div>
  )
}
