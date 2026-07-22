"use client";

import { motion, type Variants } from "motion/react";
import {
  BrainCircuit,
  Gauge,
  Columns3,
  KeyRound,
  Sparkles,
  CalendarDays,
} from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Campaign Generator",
    desc: "Describe your goal once. Our AI researches, structures, and builds a complete multi-week learning campaign with curated resources.",
    iconBg: "bg-[#ce82ff]",
    iconColor: "text-white",
  },
  {
    icon: Gauge,
    title: "Gamified XP & Analytics",
    desc: "Earn XP for every task completed and quest verified. Track your streaks, weekly points, and achievement badges. Level up as you learn, turning discipline into a rewarding game.",
    iconBg: "bg-eager-green",
    iconColor: "text-white",
  },
  {
    icon: Columns3,
    title: "Interactive Kanban Boards",
    desc: "Visualize your progress with drag-free Kanban columns. Move tasks from To Do \u2192 Ongoing \u2192 Done as you crush each milestone.",
    iconBg: "bg-spark-blue",
    iconColor: "text-white",
  },
  {
    icon: KeyRound,
    title: "Local Secure API Keys",
    desc: "Bring your own Gemini API key. It stays in your browser's localStorage and is never stored on our servers.",
    iconBg: "bg-[#ff9600]",
    iconColor: "text-white",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Verification",
    desc: "Prove your understanding by answering AI quizzes at the end of each quest. Get instant feedback and unlock the next module.",
    iconBg: "bg-[#ff4b4b]",
    iconColor: "text-white",
  },
  {
    icon: CalendarDays,
    title: "Calendar Quest Planning",
    desc: "Schedule your quests on an interactive calendar view. Plan your week, set deadlines, and see your entire campaign at a glance.",
    iconBg: "bg-[#ff6b8a]",
    iconColor: "text-white",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", duration: 0.72, bounce: 0 },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.15, staggerChildren: 0.1 },
  },
};

export default function Features1() {
  return (
    <section className="bg-paper-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="font-feather text-heading leading-heading font-black tracking-[-0.02em] text-center text-eager-green">
            This Isn't Your Average Checklist
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-body leading-body font-medium text-pencil-gray">
            To-do lists are boring. Sana turns your goals into a role-playing game
            where every task earns XP, unlocks achievements, and builds real
            skills.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="rounded-xl border-2 border-faded-gray bg-paper-white p-6 transition-colors hover:border-charcoal"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.iconBg} ${f.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-duolingo-sans text-subheading leading-subheading font-bold text-charcoal">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-body leading-body text-pencil-gray">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
