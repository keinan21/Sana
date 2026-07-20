"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ACHIEVEMENTS, getAchievementById } from "@/lib/achievements"
import { getLevelName } from "@/lib/levels"
import type { LearningCircuitData } from "@/lib/types"

export interface MilestoneResult {
  level: number
  levelName: string
  nextLevelName: string
  percentage: number
}

function computeLevel(totalXp: number): number {
  return Math.floor(totalXp / 500) + 1
}

function xpForNextLevel(totalXp: number): number {
  return 500 - (totalXp % 500)
}

async function checkAchievements(
  userId: string,
  ctx: {
    newStreak?: number
    totalXp?: number
    circuitData?: LearningCircuitData
  }
): Promise<string[]> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [todayTaskCount, totalTaskCount, verificationAwards, campaignCount, speedBonusCount, user] = await Promise.all([
    prisma.pointsAward.count({
      where: { userId, reason: "task_completion", createdAt: { gte: todayStart } },
    }),
    prisma.pointsAward.count({
      where: { userId, reason: "task_completion" },
    }),
    prisma.pointsAward.findMany({
      where: { userId, reason: "ai_verification" },
      select: { metadata: true },
    }),
    prisma.pointsAward.count({
      where: { userId, reason: "campaign_completion" },
    }),
    prisma.pointsAward.count({
      where: { userId, reason: "speed_bonus" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, totalXp: true },
    }),
  ])

  const streak = ctx.newStreak ?? user?.streakCount ?? 0
  const level = ctx.totalXp ? computeLevel(ctx.totalXp) : computeLevel(user?.totalXp ?? 0)
  const uniqueQuestIds = new Set(
    verificationAwards.map((a) => (a.metadata as Record<string, unknown>)?.questId as string).filter(Boolean)
  )
  const questCount = uniqueQuestIds.size

  const checkThreshold = (actual: number, threshold: number) => actual >= threshold

  const candidateAchievements: string[] = []

  for (const def of ACHIEVEMENTS) {
    const alreadyEarned = await prisma.userAchievement.findFirst({
      where: { userId, achievementId: def.id },
    })
    if (alreadyEarned) continue

    let earned = false
    switch (def.category) {
      case "onboarding":
        if (def.id === "first_step" && totalTaskCount >= 1) earned = true
        if (def.id === "ai_scholar" && verificationAwards.length >= 1) earned = true
        if (def.id === "consistent_router" && ctx.circuitData && questHasAllColumns(ctx.circuitData)) earned = true
        break
      case "focused":
        if (def.threshold !== undefined && checkThreshold(todayTaskCount, def.threshold)) earned = true
        break
      case "consistent":
        if (def.threshold !== undefined && checkThreshold(streak, def.threshold)) earned = true
        break
      case "goal_breaker":
        if (def.threshold !== undefined && checkThreshold(level, def.threshold)) earned = true
        break
      case "quest_veteran":
        if (def.threshold !== undefined && checkThreshold(questCount, def.threshold)) earned = true
        break
      case "campaign_champ":
        if (def.threshold !== undefined && checkThreshold(campaignCount, def.threshold)) earned = true
        break
      case "speed_demon":
        if (def.threshold !== undefined && checkThreshold(speedBonusCount, def.threshold)) earned = true
        break
    }

    if (earned) {
      candidateAchievements.push(def.id)
    }
  }

  if (candidateAchievements.length > 0) {
    await prisma.userAchievement.createMany({
      data: candidateAchievements.map((aid) => ({ userId, achievementId: aid })),
      skipDuplicates: true,
    })
  }

  return candidateAchievements
}

async function checkMilestones(userId: string, totalXp: number): Promise<MilestoneResult[]> {
  const level = computeLevel(totalXp)
  const percentage = Math.floor(((totalXp % 500) / 500) * 100)

  const thresholds = [25, 50, 75]
  const milestones: MilestoneResult[] = []

  const existingMilestones = await prisma.pointsAward.findMany({
    where: { userId, reason: "milestone" },
    select: { metadata: true },
  })

  const existingSet = new Set(
    existingMilestones
      .map((m) => (m.metadata as Record<string, unknown>) as { level?: number; percentage?: number } | null)
      .filter((m): m is { level: number; percentage: number } => m != null && typeof m.level === "number" && typeof m.percentage === "number")
      .map((m) => `${m.level}-${m.percentage}`)
  )

  for (const threshold of thresholds) {
    if (percentage >= threshold && !existingSet.has(`${level}-${threshold}`)) {
      await prisma.pointsAward.create({
        data: {
          userId,
          points: 0,
          reason: "milestone",
          metadata: { level, percentage: threshold },
        },
      })
      milestones.push({
        level,
        levelName: getLevelName(level),
        nextLevelName: getLevelName(level + 1),
        percentage: threshold,
      })
    }
  }

  return milestones
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
    const levelName = getLevelName(level)

    const now = new Date()
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

    const nonMilestoneAwards = user.pointsAwards.filter((a) => a.reason !== "milestone")
    const displayAwards = nonMilestoneAwards.slice(0, 20)

    let newerPoints = 0
    const recentAwards = displayAwards.map((a) => {
      const total = user.totalXp - newerPoints
      newerPoints += a.points
      return {
        id: a.id,
        awarded: a.points,
        date: a.createdAt.toISOString(),
        total,
        trigger: {
          id: a.id,
          type: a.reason,
          points: a.points,
          metricName: a.reason,
        },
      }
    })

    return {
      success: true,
      data: {
        totalXp: user.totalXp,
        level,
        levelName,
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
    if (!todo.isDone) return { success: true as const, xpAwarded: 0, achievements: [] as string[], milestones: [] as MilestoneResult[] }

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

    let newStreak = user.streakCount
    if (wasYesterday) {
      newStreak = user.streakCount + 1
    } else if (isNewDay) {
      newStreak = user.streakCount > 0 ? user.streakCount + 1 : 1
    }

    const taskXp = 25

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalXp: { increment: taskXp },
          streakCount: newStreak,
          lastTaskDate: now,
        },
      })
      await tx.pointsAward.create({
        data: {
          userId: user.id,
          points: taskXp,
          reason: "task_completion",
          metadata: { campaignId, questId, taskId, task: todo.task },
        },
      })
    })

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    const currentTotalXp = updatedUser?.totalXp ?? user.totalXp + taskXp

    const [achievements, milestones] = await Promise.all([
      checkAchievements(user.id, {
        newStreak: updatedUser?.streakCount ?? newStreak,
        totalXp: currentTotalXp,
        circuitData,
      }),
      checkMilestones(user.id, currentTotalXp),
    ])

    return { success: true, xpAwarded: taskXp, achievements, milestones } as const
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

    const modul = circuitData.moduls.find((m) => m.id === questId)
    let speedBonusXp = 0
    if (modul?.createdAt && modul.idealDaysToComplete > 0) {
      const created = new Date(modul.createdAt).getTime()
      const deadline = created + modul.idealDaysToComplete * 86400000
      const now = Date.now()
      if (now <= deadline) {
        const elapsed = now - created
        const total = deadline - created
        speedBonusXp = (elapsed / total) <= 0.5 ? 100 : 50
      }
    }

    const questXp = 100
    const campaignBonusXp = allQuestsDone ? 500 : 0
    const totalXpAwarded = questXp + campaignBonusXp + speedBonusXp

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
      if (speedBonusXp > 0) {
        await tx.pointsAward.create({
          data: {
            userId: user.id,
            points: speedBonusXp,
            reason: "speed_bonus",
            metadata: { campaignId, questId, bonusType: speedBonusXp === 100 ? "super" : "normal" },
          },
        })
      }
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

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
    const currentTotalXp = updatedUser?.totalXp ?? user.totalXp + totalXpAwarded

    const [achievements, milestones] = await Promise.all([
      checkAchievements(user.id, {
        totalXp: currentTotalXp,
        circuitData,
      }),
      checkMilestones(user.id, currentTotalXp),
    ])

    return { success: true, xpAwarded: totalXpAwarded, achievements, milestones } as const
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
