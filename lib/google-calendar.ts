import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { Modul, LearningCircuitData } from "@/lib/types";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Google Calendar OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, " +
      "and GOOGLE_REDIRECT_URI in .env.local"
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId,
  });
}

export async function handleCallback(code: string): Promise<{
  tokens: { access_token: string; refresh_token: string | null; expiry_date: number };
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return {
    tokens: {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? null,
      expiry_date: tokens.expiry_date!,
    },
  };
}

async function getValidClient(userId: string) {
  const token = await prisma.googleCalendarToken.findUnique({
    where: { userId },
  });
  if (!token) throw new Error("Google Calendar not connected");

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: Number(token.expiryDate),
  });

  oauth2Client.on("tokens", async (newTokens) => {
    const updateData: { accessToken: string; expiryDate: Date; refreshToken?: string } = {
      accessToken: newTokens.access_token ?? token.accessToken,
      expiryDate: newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : token.expiryDate,
    };
    if (newTokens.refresh_token) {
      updateData.refreshToken = newTokens.refresh_token;
    }
    await prisma.googleCalendarToken.update({
      where: { userId },
      data: updateData,
    });
  });

  return oauth2Client;
}

function buildQuestEvent(
  campaignTitle: string,
  campaignId: string,
  quest: Modul,
  questIndex: number
) {
  const startDate = quest.createdAt
    ? new Date(quest.createdAt)
    : new Date();

  const daysToComplete = quest.idealDaysToComplete || 7;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToComplete);

  const taskLines = quest.todos
    .map((t) => `${t.isDone ? "✅" : "☐"} ${t.task}`)
    .join("\n");

  const resourceLines =
    quest.resources && quest.resources.length > 0
      ? "\n\n🔗 Resources:\n" +
        quest.resources.map((r) => `• ${r.title}: ${r.url}`).join("\n")
      : "";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "";
  const campaignLink = baseUrl ? `${baseUrl}/campaign/${campaignId}` : "";

  const description = [
    `🎯 Campaign: ${campaignTitle}`,
    `📅 Quest ${questIndex + 1}: ${quest.title} (${daysToComplete} days)`,
    campaignLink ? `🔗 View in Sana: ${campaignLink}` : "",
    ``,
    `📋 Tasks:`,
    taskLines,
    resourceLines,
  ].join("\n");

  return {
    summary: `📋 ${quest.title}`,
    description,
    start: {
      date: startDate.toISOString().split("T")[0],
      timeZone: "UTC",
    },
    end: {
      date: endDate.toISOString().split("T")[0],
      timeZone: "UTC",
    },
    colorId: quest.done ? "2" : undefined,
  };
}

export async function createQuestEvent(
  userId: string,
  campaignTitle: string,
  campaignId: string,
  quest: Modul,
  questIndex: number
): Promise<string> {
  const auth = await getValidClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const event = buildQuestEvent(campaignTitle, campaignId, quest, questIndex);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data.id!;
}

export async function updateQuestEvent(
  userId: string,
  eventId: string,
  campaignTitle: string,
  campaignId: string,
  quest: Modul,
  questIndex: number
): Promise<void> {
  const auth = await getValidClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const event = buildQuestEvent(campaignTitle, campaignId, quest, questIndex);

  await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: event,
  });
}

export async function deleteQuestEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const auth = await getValidClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}

export async function syncCampaignToCalendar(
  userId: string,
  campaignId: string
): Promise<{ created: number; updated: number }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  const circuitData = campaign.circuitData as unknown as LearningCircuitData;

  const existingEvents = (circuitData as any).googleCalendarEvents as
    | Record<string, string>
    | undefined;

  let created = 0;
  let updated = 0;

  const updatedEventMap: Record<string, string> = {};

  for (let i = 0; i < circuitData.moduls.length; i++) {
    const quest = circuitData.moduls[i];
    const existingEventId = existingEvents?.[quest.id];

    if (existingEventId) {
      try {
        await updateQuestEvent(userId, existingEventId, circuitData.title, campaignId, quest, i);
        updatedEventMap[quest.id] = existingEventId;
        updated++;
      } catch {
        const eventId = await createQuestEvent(userId, circuitData.title, campaignId, quest, i);
        updatedEventMap[quest.id] = eventId;
        created++;
      }
    } else {
      const eventId = await createQuestEvent(userId, circuitData.title, campaignId, quest, i);
      updatedEventMap[quest.id] = eventId;
      created++;
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      circuitData: {
        ...circuitData,
        googleCalendarEvents: updatedEventMap,
      } as any,
    },
  });

  return { created, updated };
}

export async function removeCampaignFromCalendar(
  userId: string,
  campaign: { circuitData: any }
): Promise<number> {
  const circuitData = campaign.circuitData as any;
  const existingEvents = circuitData.googleCalendarEvents as Record<string, string> | undefined;
  if (!existingEvents) return 0;

  let deleted = 0;
  for (const eventId of Object.values(existingEvents)) {
    try {
      await deleteQuestEvent(userId, eventId);
      deleted++;
    } catch {
      // event may have been already removed
    }
  }
  return deleted;
}

export async function revokeToken(userId: string): Promise<void> {
  const token = await prisma.googleCalendarToken.findUnique({
    where: { userId },
  });
  if (!token) return;

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });
    await oauth2Client.revokeCredentials();
  } catch {
    // token may already be revoked
  }

  await prisma.googleCalendarToken.delete({ where: { userId } });
}
