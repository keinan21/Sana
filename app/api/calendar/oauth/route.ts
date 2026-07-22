import { auth } from "@clerk/nextjs/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const authUrl = getAuthUrl(user.id);
  return Response.redirect(authUrl, 302);
}
