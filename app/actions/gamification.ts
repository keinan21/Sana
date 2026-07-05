"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ACHIEVEMENTS } from "@/lib/achievements"
import type { LearningCircuitData, Modul } from "@/lib/types"

function computeLevel(totalXp: number): number {
  return Math.floor(totalXp / 500) + 1
}

function xpForNextLevel(totalXp: number): number {
  return 500 - (totalXp % 500)
}

export async function getDashboardData() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" } as const

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        pointsAwards: { orderBy: { createdAt: "desc" }, take: 50 },
        achievements: true,
      },
    })
    if (!user) return { success: false, error: "User not found" } as const

    const level = computeLevel(user.totalXp)
    const xpToNext = xpForNextLevel(user.totalXp)

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const chartData: { date: string; total: number; change: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      const dayAwards = user.pointsAwards.filter(
        (a) => a.createdAt >= dayStart && a.createdAt < dayEnd
      )
      const dayTotal = dayAwards.reduce((s, a) => s + a.points, 0)
      chartData.push({
        date: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: dayTotal,
        change: dayTotal,
      })
    }

    const cumulative = []
    let running = 0
    for (const pt of chartData) {
      running += pt.total
      cumulative.push({ ...pt, total: running, change: pt.total })
    }

    const userAchievementMap = new Set(user.achievements.map((a) => a.achievementId))
    const allAchievements = ACHIEVEMENTS.map((def) => {
      const ua = user.achievements.find((a) => a.achievementId === def.id)
      return {
        ...def,
        trigger: "metric" as const,
        achievedAt: ua ? ua.achievedAt.toISOString() : null,
      }
    })

    const recentAwards = user.pointsAwards.slice(0, 20).map((a) => ({
      id: a.id,
      awarded: a.points,
      date: a.createdAt.toISOString(),
      total: 0,
      trigger: {
        id: a.id,
        type: a.reason,
        points: a.points,
        metricName: a.reason,
      },
    }))

    return {
      success: true,
      data: {
        totalXp: user.totalXp,
        level,
        xpToNext,
        streakCount: user.streakCount,
        lastTaskDate: user.lastTaskDate?.toISOString() ?? null,
        chartData: cumulative,
        achievements: allAchievements,
        recentAwards,
      },
    } as const
  } catch (error) {
    console.error("getDashboardData error:", error)
    return { success: false, error: "Failed to load dashboard" } as const
  }
}

export async function checkCampaignLimit() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" } as const

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return { success: true, withinLimit: false, count: 0 } as const

    const count = await prisma.campaign.count({ where: { userId: user.id } })
    return { success: true, withinLimit: count < 5, count } as const
  } catch (error) {
    console.error("checkCampaignLimit error:", error)
    return { success: false, error: "Failed to check limit" } as const
  }
}

export async function awardTaskXp(campaignId: string, questId: string, taskId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" } as const

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return { success: false, error: "User not found" } as const

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return { success: false, error: "Campaign not found" } as const

    const circuitData = campaign.circuitData as unknown as LearningCircuitData
    const modul = circuitData.moduls.find((m) => m.id === questId)
    if (!modul) return { success: false, error: "Quest not found" } as const

    const todo = modul.todos.find((t) => t.id === taskId)
    if (!todo) return { success: false, error: "Task not found" } as const
    if (!todo.isDone) return { success: true, xpAwarded: 0 } as const

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const wasYesterday =
      user.lastTaskDate &&
      user.lastTaskDate.getDate() === yesterday.getDate() &&
      user.lastTaskDate.getMonth() === yesterday.getMonth() &&
      user.lastTaskDate.getFullYear() === yesterday.getFullYear()

    const isNewDay =
      !user.lastTaskDate ||
      user.lastTaskDate.getDate() !== now.getDate() ||
      user.lastTaskDate.getMonth() !== now.getMonth() ||
      user.lastTaskDate.getFullYear() !== now.getFullYear()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        streakCount: wasYesterday ? { increment: 1 } : isNewDay ? 1 : undefined,
        lastTaskDate: now,
      },
    })

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    const currentStreak = updatedUser?.streakCount ?? user.streakCount

    const achievementsToAward: string[] = []

    const existingFirst = await prisma.userAchievement.findFirst({
      where: { userId: user.id, achievementId: "first_step" },
    })
    if (!existingFirst) achievementsToAward.push("first_step")

    if (currentStreak >= 3) {
      const existing = await prisma.userAchievement.findFirst({
        where: { userId: user.id, achievementId: "streak_3" },
      })
      if (!existing) achievementsToAward.push("streak_3")
    }
    if (questHasAllColumns(circuitData)) {
      const existing = await prisma.userAchievement.findFirst({
        where: { userId: user.id, achievementId: "consistent_router" },
      })
      if (!existing) achievementsToAward.push("consistent_router")
    }

    for (const aid of achievementsToAward) {
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: aid },
      })
    }

    return { success: true, xpAwarded: 0, achievements: achievementsToAward } as const
  } catch (error) {
    console.error("awardTaskXp error:", error)
    return { success: false, error: "Failed to award XP" } as const
  }
}

export async function awardVerificationXp(campaignId: string, questId: string) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: "Not authenticated" } as const

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return { success: false, error: "User not found" } as const

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return { success: false, error: "Campaign not found" } as const

    const circuitData = campaign.circuitData as unknown as LearningCircuitData
    const allQuestsDone = circuitData.moduls.every((m) => m.done)

    const questXp = 100
    const campaignBonusXp = allQuestsDone ? 500 : 0
    const totalXpAwarded = questXp + campaignBonusXp

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { totalXp: { increment: totalXpAwarded } },
      })
      await tx.pointsAward.create({
        data: {
          userId: user.id,
          points: questXp,
          reason: "ai_verification",
          metadata: { campaignId, questId },
        },
      })
      if (campaignBonusXp > 0) {
        await tx.pointsAward.create({
          data: {
            userId: user.id,
            points: campaignBonusXp,
            reason: "campaign_completion",
            metadata: { campaignId },
          },
        })
      }
    })

    const achievementsToAward: string[] = []
    const existing = await prisma.userAchievement.findFirst({
      where: { userId: user.id, achievementId: "ai_scholar" },
    })
    if (!existing) {
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: "ai_scholar" },
      })
      achievementsToAward.push("ai_scholar")
    }

    return { success: true, xpAwarded: totalXpAwarded, achievements: achievementsToAward } as const
  } catch (error) {
    console.error("awardVerificationXp error:", error)
    return { success: false, error: "Failed to award XP" } as const
  }
}

function questHasAllColumns(circuitData: LearningCircuitData): boolean {
  const moduls = circuitData.moduls
  const hasAllDone = moduls.some((m) => m.todos.every((t) => t.isDone))
  const hasSomeDone = moduls.some((m) => m.todos.some((t) => t.isDone) && !m.todos.every((t) => t.isDone))
  const hasNoneDone = moduls.some((m) => m.todos.every((t) => !t.isDone))
  return hasAllDone && hasSomeDone && hasNoneDone
}
