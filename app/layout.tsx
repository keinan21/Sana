import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Sana — AI-Powered Goal Breaker",
    template: "%s | Sana",
  },
  description:
    "Sana turns massive life goals into bite-sized weekly quests. Track XP, conquer Kanban boards, and verify progress with AI — all in one place.",
  openGraph: {
    title: "Sana — AI-Powered Goal Breaker",
    description:
      "Sana turns massive life goals into bite-sized weekly quests. Track XP, conquer Kanban boards, and verify progress with AI — all in one place.",
    url: "https://sana.ai",
    siteName: "Sana",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sana — AI-Powered Goal Breaker",
    description:
      "Sana turns massive life goals into bite-sized weekly quests. Track XP, conquer Kanban boards, and verify progress with AI — all in one place.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/assets/logo/logo.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/assets/logo/logo.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", nunito.variable, nunitoSans.variable, "font-duolingo-sans", inter.variable)}
    >
      <body className="min-h-screen w-full bg-paper-white flex flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}