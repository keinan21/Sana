"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated";
import type { LearningCircuitData, Modul, Quest } from "@/lib/types";
import type { LearningCircuit } from "@/app/actions/generator";
import { awardTaskXp, awardVerificationXp } from "@/app/actions/gamification";

export async function createDatabaseCampaign(
  input: LearningCircuit,
  isLiteMode?: boolean
): Promise<{ success: boolean; data?: { id: string; title: string }; error?: string }> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return { success: false, error: "Could not resolve user" };
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      user = await prisma.user.create({
        data: { clerkId, email, name: fullName },
      });
    }

    const circuitData: LearningCircuitData = {
      id: input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      title: input.title,
      targetDescription: input.targetDescription,
      totalEstimatedWeeks: input.totalEstimatedWeeks,
      createdAt: input.createdAt,
      moduls: input.moduls.map((m) => ({
        id: m.id,
        title: m.title,
        idealDaysToComplete: m.idealDaysToComplete,
        done: m.done,
        todos: m.todos.map((t) => {
          const resources = t.resources.map((r) => ({
            platform: r.platform,
            title: r.title,
            url: r.url,
          }))
          // Safety net: ensure every todo has at least 1 resource (skip in lite mode)
          if (!isLiteMode && resources.length === 0) {
            const searchQuery = encodeURIComponent(`${t.task} tutorial`);
            resources.push({
              platform: "Google Search",
              title: `Search results for "${t.task}"`,
              url: `https://www.google.com/search?q=${searchQuery}`,
            })
          }
          return {
            id: t.id,
            task: t.task,
            isDone: t.isDone,
            resources,
          }
        }),
      })),
    };

    const campaign = await prisma.campaign.create({
      data: {
        title: input.title,
        targetDescription: input.targetDescription,
        totalEstimatedWeeks: input.totalEstimatedWeeks,
        circuitData: circuitData as unknown as Prisma.InputJsonValue,
        userId: user.id,
      },
    });

    return {
      success: true,
      data: { id: campaign.id, title: campaign.title },
    };
  } catch (error) {
    console.error("createDatabaseCampaign error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save campaign",
    };
  }
}

export async function getDatabaseCampaignById(
  campaignId: string
): Promise<{ success: boolean; data?: LearningCircuitData; error?: string }> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const circuitData = campaign.circuitData as unknown as LearningCircuitData;

    return { success: true, data: circuitData };
  } catch (error) {
    console.error("getDatabaseCampaignById error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch campaign",
    };
  }
}

export async function updateDatabaseCampaignProgress(
  campaignId: string,
  updatedModuls: Modul[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const existing = campaign.circuitData as unknown as LearningCircuitData;

    const updatedCircuitData: LearningCircuitData = {
      ...existing,
      moduls: updatedModuls,
    };

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        circuitData: updatedCircuitData as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("updateDatabaseCampaignProgress error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update campaign",
    };
  }
}

export async function toggleQuestTask(
  campaignId: string,
  questId: string,
  taskId: string
): Promise<{ success: boolean; xpAwarded?: number; achievements?: string[]; error?: string }> {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return { success: false, error: "Campaign not found" };

    const existing = campaign.circuitData as unknown as LearningCircuitData;

    let taskWasDone = false;
    const updatedModuls = existing.moduls.map((modul) => {
      if (modul.id !== questId) return modul;
      return {
        ...modul,
        todos: modul.todos.map((todo) => {
          if (todo.id === taskId) {
            taskWasDone = todo.isDone;
            return { ...todo, isDone: !todo.isDone };
          }
          return todo;
        }),
      };
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        circuitData: { ...existing, moduls: updatedModuls } as unknown as Prisma.InputJsonValue,
      },
    });

    const justCompleted = !taskWasDone && updatedModuls
      .find((m) => m.id === questId)?.todos.find((t) => t.id === taskId)?.isDone;

    if (justCompleted) {
      await awardTaskXp(campaignId, questId, taskId);
    }

    return { success: true };
  } catch (error) {
    console.error("toggleQuestTask error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle task",
    };
  }
}

export async function setQuestVerified(
  campaignId: string,
  questId: string
): Promise<{ success: boolean; xpAwarded?: number; achievements?: string[]; error?: string }> {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return { success: false, error: "Campaign not found" };

    const existing = campaign.circuitData as unknown as LearningCircuitData;

    const updatedModuls = existing.moduls.map((modul) =>
      modul.id === questId ? { ...modul, done: true } : modul
    );

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        circuitData: { ...existing, moduls: updatedModuls } as unknown as Prisma.InputJsonValue,
      },
    });

    const xpResult = await awardVerificationXp(campaignId, questId);
    if (xpResult.success && xpResult.xpAwarded) {
      return { success: true, xpAwarded: xpResult.xpAwarded, achievements: xpResult.achievements };
    }

    return { success: true };
  } catch (error) {
    console.error("setQuestVerified error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify quest",
    };
  }
}

export async function getUserCampaigns(): Promise<{
  success: boolean;
  data?: {
    id: string
    title: string
    targetDescription: string
    totalEstimatedWeeks: number
    circuitData: unknown
    createdAt: string
  }[]
  error?: string
}> {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return { success: false, error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({ where: { clerkId } })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        targetDescription: true,
        totalEstimatedWeeks: true,
        circuitData: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      data: campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        targetDescription: c.targetDescription,
        totalEstimatedWeeks: c.totalEstimatedWeeks,
        circuitData: c.circuitData,
        createdAt: c.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("getUserCampaigns error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch campaigns",
    }
  }
}