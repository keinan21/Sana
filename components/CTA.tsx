"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function CTASection() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Ready to Break Your First Limit?
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          Your first campaign is free. No credit card required.
        </p>

        <button
          onClick={handleClick}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 border-2 border-amber-600 hover:bg-amber-500 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
        </button>
      </div>
    </section>
  );
}
