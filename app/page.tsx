"use client";

import CTASection from "@/components/CTA";
import Features1 from "@/components/feature";
import Hero from "@/components/hero-wave";
export default function Home() {
  return (
    <main>
      <Hero
        brandName="sana"
        eyebrowText="Not Your Ordinary Todo List"
        title="Boost Your Productivity with the Help of AI"
        description="Sana turns big ambitions into weekly quests. Earn XP, level up, and let AI keep you honest — no spreadsheets, no guilt, just progress."
        primaryText="Start Your Quest"
        primaryHref="/dashboard"
        usersText="Join 10,000+ players already leveling up"
      />
      <Features1 />
      <CTASection />
    </main>
  );
}
