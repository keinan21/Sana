import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/prisma/generated"; // Sesuaikan jika folder generated kamu berbeda jalur

// Inisialisasi Prisma khusus untuk Webhook (Bypass Serverless Adapter)
const neonConnectionString = "postgresql://neondb_owner:npg_J3YoWF1EAzdm@ep-summer-poetry-aong97qi-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const adapter = new PrismaNeon({ connectionString: neonConnectionString });
const prisma = new PrismaClient({ adapter });

export async function POST(req: Request) {
  // 1. Ambil Clerk Webhook Secret dari environment variable
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    return new Response("Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env", {
      status: 500,
    });
  }

  // 2. Ambil headers untuk verifikasi keamanan dari Svix
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // 3. Ambil body dari request
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // 4. Verifikasi apakah request ini benar-benar datang dari Clerk (bukan hacker)
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  // 5. LOGIKA SINKRONISASI DATABASE
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Ambil email utama user
    const email = email_addresses?.[0]?.email_address || `${id}@no-email.com`;
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Clerk User";

    try {
      // Masukkan user baru ke database Neon
      await prisma.user.create({
        data: {
          id: id,
          clerkId: id,
          email: email,
          name: name,
        },
      });
      console.log(`🎉 User ${id} berhasil disinkronkan ke Neon!`);
    } catch (error) {
      console.error("Gagal menyimpan user ke database:", error);
      return new Response("Database Error", { status: 500 });
    }
  }

  return new Response("Webhook received successfully", { status: 200 });
}