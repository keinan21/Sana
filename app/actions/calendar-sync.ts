"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  syncCampaignToCalendar as syncToCalendar,
  removeCampaignFromCalendar,
  revokeToken,
} from "@/lib/google-calendar";

export async function getCalendarStatus(): Promise<{
  connected: boolean;
  email?: string;
  syncedCampaignCount?: number;
}> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { connected: false };

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return { connected: false };

  const token = await prisma.googleCalendarToken.findUnique({
    where: { userId: user.id },
  });

  if (!token) return { connected: false };

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    select: { circuitData: true },
  });

  const syncedCount = campaigns.filter((c) => {
    const data = c.circuitData as any;
    return data?.googleCalendarEvents && Object.keys(data.googleCalendarEvents).length > 0;
  }).length;

  return {
    connected: true,
    syncedCampaignCount: syncedCount,
  };
}

export async function getCalendarAuthUrl(): Promise<string> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  const { getAuthUrl } = await import("@/lib/google-calendar");
  return getAuthUrl(user.id);
}

export async function syncCampaign(campaignId: string): Promise<{
  success: boolean;
  created?: number;
  updated?: number;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return { success: false, error: "User not found" };

    const token = await prisma.googleCalendarToken.findUnique({
      where: { userId: user.id },
    });
    if (!token) return { success: false, error: "Google Calendar not connected" };

    const result = await syncToCalendar(user.id, campaignId);
    return { success: true, ...result };
  } catch (error) {
    console.error("syncCampaign error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync campaign",
    };
  }
}

export async function disconnectCalendar(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Not authenticated" };

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return { success: false, error: "User not found" };

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      select: { id: true, circuitData: true },
    });

    for (const campaign of campaigns) {
      const data = campaign.circuitData as any;
      if (data?.googleCalendarEvents) {
        await removeCampaignFromCalendar(user.id, campaign);
        data.googleCalendarEvents = {};
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { circuitData: data },
        });
      }
    }

    await revokeToken(user.id);
    return { success: true };
  } catch (error) {
    console.error("disconnectCalendar error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disconnect",
    };
  }
}
