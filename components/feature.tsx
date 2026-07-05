import {
  BrainCircuit,
  Trophy,
  Columns3,
  KeyRound,
  Sparkles,
  LineChart,
} from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Campaign Generator",
    desc: "Describe your goal once. Our AI researches, structures, and builds a complete multi-week learning campaign with curated resources.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: Trophy,
    title: "Gamified XP & Levels",
    desc: "Earn XP for every task completed and quest verified. Level up as you learn, turning discipline into a rewarding game.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Columns3,
    title: "Interactive Kanban Boards",
    desc: "Visualize your progress with drag-free Kanban columns. Move tasks from To Do → Ongoing → Done as you crush each milestone.",
    color: "bg-sky-100 text-sky-700",
  },
  {
    icon: KeyRound,
    title: "Local Secure API Keys",
    desc: "Bring your own Gemini API key. It stays in your browser's localStorage and is never stored on our servers.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Verification",
    desc: "Prove your understanding by answering AI quizzes at the end of each quest. Get instant feedback and unlock the next module.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: LineChart,
    title: "Progress Analytics",
    desc: "Track your streaks, weekly points, and achievement badges. Stay motivated with clear metrics that show how far you've come.",
    color: "bg-indigo-100 text-indigo-700",
  },
];

export default function Features1() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
          Everything You Need to Crush Your Goals
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">
          From AI-powered campaign generation to gamified progress tracking —
          sana gives you the tools to turn ambition into achievement.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl border-2 border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
