import { handleCallback } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/settings?calendar=error" },
    });
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  try {
    const { tokens } = await handleCallback(code);

    await prisma.googleCalendarToken.upsert({
      where: { userId: state },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
      },
      create: {
        userId: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
      },
    });

    return new Response(null, {
      status: 302,
      headers: { Location: "/settings?calendar=connected" },
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return new Response(null, {
      status: 302,
      headers: { Location: "/settings?calendar=error" },
    });
  }
}
