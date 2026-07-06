"use client";

import CTASection from "@/components/CTA";
import Features1 from "@/components/feature";
import Hero from "@/components/hero-10";

export default function Home() {
  return (
    <main>
      <Hero
        brandName="sana"
        eyebrowText="AI-Powered Goal Breaker"
        title="Break Your Limits, Not Your Spirit.&#10;AI-Powered Gamified Goal Achiever."
        description="Sana turns massive life goals into bite-sized weekly quests. Track XP, conquer Kanban boards, and verify progress with AI — all in one place."
        primaryText="Get Started Free"
        primaryHref="/dashboard"
        usersText="Join 10,000+ goal-crushers already building"
      />
      <Features1 />
      <CTASection />
    </main>
  );
}
