"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUserCampaigns } from "@/app/actions/db-campaigns"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import GlobalNavbar from "@/components/global-navbar"
import { Badge } from "@/components/ui/badge"
import { Plus, Sparkles, Target } from "lucide-react"
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

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserCampaigns().then((res) => {
      if (res.success && res.data) {
        setCampaigns(res.data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-500 flex items-center justify-center font-mono text-sm">
        Loading campaigns...
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <GlobalNavbar />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Campaigns</h1>
            <p className="text-sm text-slate-500 mt-1">
              All your active learning circuits.
            </p>
          </div>
          <Button
            onClick={() => router.push("/campaign/create")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 border-2 border-emerald-700"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            New Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-xl border-2 border-slate-200 bg-white p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Target className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-900 font-semibold">No campaigns found</p>
                <p className="text-slate-500 text-sm mt-1">
                  Break your first big goal today!
                </p>
              </div>
              <Button
                onClick={() => router.push("/campaign/create")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border-2 border-emerald-700"
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
                  <div className="rounded-xl border-2 border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                        {c.title}
                      </h3>
                      <Badge variant="outline" className="shrink-0 text-slate-500 text-[10px] px-2 border-2 border-slate-200">
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
                      <p className="text-[10px] text-slate-500 font-mono">
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
    </div>
  )
}
