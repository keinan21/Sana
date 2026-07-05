"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncClerkUserToNeon() {
  try {
    const user = await currentUser();

    // Jika tidak ada user yang sedang login di Clerk, hentikan proses
    if (!user) {
      return { success: false, error: "Tidak ada user aktif di Clerk" };
    }

    const email = user.emailAddresses[0]?.emailAddress || "";
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    // Logika UPSERT: Cari berdasarkan clerkId. 
    // Jika ada -> update email & nama. Jika belum ada -> buat data baru.
    const syncedUser = await prisma.user.upsert({
      where: {
        clerkId: user.id, // Mencari user berdasarkan ID unik dari Clerk
      },
      update: {
        email: email,
        name: fullName,
      },
      create: {
        clerkId: user.id,
        email: email,
        name: fullName,
      },
    });

    console.log("🟢 [Neon Sync] Berhasil mengamankan user:", syncedUser.email);
    return { success: true };
  } catch (error: any) {
    console.error("🔴 [Neon Sync] Gagal sinkronisasi:", error);
    return { success: false, error: error.message };
  }
}