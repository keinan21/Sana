"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUserCampaigns } from "@/app/actions/db-campaigns"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import GlobalNavbar from "@/components/global-navbar"
import { Badge } from "@/components/ui/badge"
import { Plus, Sparkles, Target, Clock } from "lucide-react"
import type { LearningCircuitData } from "@/lib/types"

interface Campaign {
  id: string
  title: string
  targetDescription: string
  totalEstimatedWeeks: number
  circuitData: unknown
  createdAt: string
}

function calcCampaignProgress(circuitData: unknown): { completed: number; total: number; percentage: number } {
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

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "My Campaigns | Sana"
    getUserCampaigns().then((res) => {
      if (res.success && res.data) {
        setCampaigns(res.data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-paper-white text-pencil-gray flex items-center justify-center font-mono text-sm">
        Loading campaigns...
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full bg-paper-white text-charcoal">
      <GlobalNavbar />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">My Campaigns</h1>
            <p className="text-sm text-pencil-gray mt-1">
              All your active learning circuits.
            </p>
          </div>
          <Button
            onClick={() => router.push("/campaign/create")}
            className="bg-eager-green hover:bg-[#4db802] text-white font-bold text-sm px-4 py-2 border-2 border-eager-green"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            New Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-storybook-green">
                <Target className="h-7 w-7 text-eager-green" />
              </div>
              <div>
                <p className="text-charcoal font-bold">No campaigns found</p>
                <p className="text-pencil-gray text-sm mt-1">
                  Break your first big goal today!
                </p>
              </div>
              <Button
                onClick={() => router.push("/campaign/create")}
                className="bg-eager-green hover:bg-[#4db802] text-white font-bold border-2 border-eager-green"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Your First Campaign
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const progress = calcCampaignProgress(c.circuitData)
              return (
                <Link key={c.id} href={`/campaign/${c.id}`}>
                  <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-5 hover:border-charcoal transition-colors cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">
                        {c.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-pencil-gray text-[10px] px-2 border-2 border-faded-gray">
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
                      <p className="text-[10px] text-pencil-gray font-mono">
                        {progress.completed} / {progress.total} tasks completed
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
