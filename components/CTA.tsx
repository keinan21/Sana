"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", duration: 0.72, bounce: 0 },
  },
};

const ctaContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.1, staggerChildren: 0.12 },
  },
};

export default function CTASection() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return (
    <section className="bg-eager-green px-6 py-12 sm:py-16">
      <motion.div
        variants={ctaContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="font-feather text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] font-black tracking-[-0.02em] text-paper-white"
        >
          Ready to Start Playing?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-3 text-body leading-body font-medium text-fresh-leaf"
        >
          Your first campaign is free. No credit card. No spreadsheet. Just your
          first quest waiting.
        </motion.p>

        <motion.div variants={fadeUp}>
          <button
            onClick={handleClick}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-paper-white px-6 py-3 text-nav-label font-bold uppercase tracking-[0.0530em] text-eager-green transition-[background-color,transform] duration-200 ease-out hover:bg-[#f0f0f0] active:scale-[0.96]"
          >
            <Sparkles className="h-4 w-4" />
            {isSignedIn ? "Back to the Game" : "Claim Your First Quest"}
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
