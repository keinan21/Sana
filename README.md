<h1 align="center">
  <br>
  <img src="assets/logo/logo.svg" alt="Sana" width="200">
  <br>
  Sana
  <br>
  <sub>AI-Powered Gamified Goal Achiever</sub>
</h1>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16"></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript 5"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS v4"></a>
  <a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" alt="Prisma 7"></a>
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon-00E599?style=flat-square&logo=neon" alt="Neon"></a>
  <a href="https://clerk.com"><img src="https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk" alt="Clerk"></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/Gemini-8E75FF?style=flat-square&logo=googlegemini" alt="Gemini AI"></a>
  <a href="https://ui.shadcn.com"><img src="https://img.shields.io/badge/shadcn/ui-000?style=flat-square&logo=shadcnui" alt="shadcn/ui"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm" alt="pnpm"></a>
</p>

<p align="center">
  <b>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#directory-structure">Structure</a> •
    <a href="#prerequisites">Prerequisites</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#ai-pipeline-details">AI Pipeline</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </b>
</p>

---

## About


The platform uses an **AI agent pipeline** (Research → Curate → Link Verify) powered by Google Gemini via the [ADK](https://github.com/google/adk), and an **AI Proof-of-Work Verifier** that reviews your practical submissions like a senior engineer.

---

## Features

| Feature | Description |
|---|---|
| **AI Campaign Generator** | Describe your goal once. AI researches best practices, roadmaps, and official docs, then builds a complete multi-week campaign with tasks and resource links. |
| **Proof-of-Work Verification** | Submit GitHub repos, live URLs, or code snippets. A strict AI auditor reviews your work, gives feedback, and a confidence score. |
| **Gamified XP & Levels** | Earn XP for tasks and quest completions. Level up with +500 XP per level. Unlock achievements and track streaks. |
| **Kanban Quest Board** | Visualize progress in three columns — To Do, Ongoing, Done. Animated transitions with spring physics via Framer Motion. |
| **Dashboard Analytics** | XP chart, level progress, task completion stats, achievement badges, and weekly points breakdown. |
| **BYO API Key** | Your Gemini API key stays in browser localStorage — never stored on the server. |
| **Clerk Auth** | Secure sign-in/sign-up with Clerk. Webhook sync to Neon PostgreSQL. |
| **Responsive UI** | Built with shadcn/ui + Tailwind CSS v4. Clean, accessible, and mobile-friendly. |

---

## How It Works

```mermaid
flowchart LR
    A[User submits goal] --> B[Research Agent<br>Google Search + Gemini]
    B --> C[Curator Agent<br>Structures circuit]
    C --> D[Link Verifier<br>HTTP checks + repair]
    D --> E[Campaign saved<br>to Neon DB]
    E --> F[User completes tasks<br>on Kanban board]
    F --> G[AI Verifier<br>reviews proof of work]
    G --> H{XP awarded?}
    H -->|Yes| I[Level up / Achievements]
    H -->|No| F
```

1. **Research** — Google Search tool + Gemini surfs best practices, 2026 roadmaps, official docs, and common pitfalls for your goal.
2. **Curate** — A second agent structures everything into a `LearningCircuit` with modules and tasks, each with 1-2 curated resource URLs.
3. **Link Verify** — Every URL is HTTP-checked. Dead links are replaced via a Google Search agent. Failing that, a search fallback URL is injected.
4. **Track** — You complete tasks on an animated Kanban board. Progress is persisted to Neon via Prisma.
5. **Verify** — Submit a GitHub repo, live app URL, or code snippet. The AI Verifier acts as a senior technical auditor and confirms or rejects the proof.
6. **Level Up** — XP is awarded per task completion and quest verification. Achievements unlock on milestones (first task, 3-day streak, all columns active, etc.).

---

## Directory Structure

```
sana/
├── app/                          # Next.js App Router pages
│   ├── actions/                  # Server Actions
│   │   ├── gamification.ts       # XP, levels, achievements logic
│   │   ├── generator.ts          # AI pipeline (research, curate, verify)
│   │   └── db-campaigns.ts       # CRUD for campaigns, quests, tasks
│   ├── api/webhooks/clerk/       # Clerk user sync webhook
│   ├── campaign/[campaign_id]/   # Campaign detail + Kanban board
│   ├── campaign/create/          # New campaign form
│   ├── campaigns/                # All campaigns listing
│   ├── dashboard/                # User dashboard
│   ├── sign-in/                  # Clerk sign-in
│   ├── sign-up/                  # Clerk sign-up
│   ├── layout.tsx                # Root layout with ClerkProvider
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Tailwind + global styles
├── components/
│   ├── ui/                       # shadcn/ui primitives (21 components)
│   ├── CTA.tsx                   # Call-to-action section
│   ├── feature.tsx               # Features grid
│   ├── global-navbar.tsx         # Navigation bar
│   └── hero-10.tsx               # Landing hero section
├── lib/
│   ├── achievements.ts           # Achievement definitions
│   ├── prisma.ts                 # Prisma client (Neon adapter)
│   ├── types.ts                  # Core TypeScript interfaces
│   └── utils.ts                  # cn() utility
├── prisma/
│   ├── schema.prisma             # DB schema
│   ├── generated/                # Prisma client output
│   └── migrations/               # DB migrations
├── prisma.config.ts              # Prisma config
├── public/                       # Static assets
├── assets/                       # Logo SVGs and backgrounds
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config
├── components.json               # shadcn/ui config
├── postcss.config.mjs            # PostCSS + Tailwind
├── eslint.config.mjs             # ESLint flat config
└── package.json                  # Dependencies & scripts
```

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** (recommended package manager)
- **A Neon PostgreSQL database** (or any PostgreSQL instance)
- **A Clerk account** — create a project at [clerk.com](https://clerk.com)
- **A Google Gemini API key** — get one at [ai.google.dev](https://ai.google.dev)

---

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/<your-org>/sana.git
cd sana
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Create `.env`:

```bash
DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

> Your Gemini API key is handled client-side in the app's API Key dialog — no server env variable needed.

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Creating a Campaign

1. Click **Get Started Free** on the landing page.
2. Sign up via Clerk (email, Google, or GitHub).
3. On the dashboard, click **New Campaign**.
4. Fill in:
   - **Learning Goal** — e.g. "Create a game with Godot"
   - **Expected Outcome** — e.g. "A working Mega Man-like platformer"
   - **Experience Level** — Beginner / Intermediate / Expert
   - **Weekly Hours** — time commitment per week
5. Click the settings icon and paste your Gemini API key (stored locally).
6. Click **Execute Strategy** — the AI pipeline runs (15-30s).
7. You're redirected to the campaign page with a full Kanban board.

### Tracking Progress

- Check off tasks on the Kanban board. Completed tasks move quests between columns (To Do → Ongoing → Done).
- XP is awarded for each task completion. The dashboard tracks level, streak, and weekly XP chart.
- Achievements unlock automatically — First Step, AI Scholar, Consistent Router, 3-Day Streak, Quest Master.

### AI Proof-of-Work Verification

1. After completing all tasks in a quest, click **Verify via AI**.
2. Choose proof type:
   - **GitHub Repository URL** — share your repo
   - **Live App / Production Link** — share a deployed app
   - **Technical Snippet** — paste code or execution logs
3. Click **Submit Proof for AI Audit**.
4. The AI Verifier reviews and returns:
   - ✅ **Verified** — XP awarded (+100 per quest, +500 bonus for completing all quests)
   - ❌ **Rejected** — detailed feedback on what's missing
5. Re-submit after acting on the feedback.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` |
| **Components** | shadcn/ui (Radix primitives + custom) |
| **Animation** | Framer Motion / Motion v12 |
| **Auth** | Clerk (OAuth, magic links, webhook sync) |
| **Database** | Neon (serverless PostgreSQL) |
| **ORM** | Prisma 7 (with `@prisma/adapter-neon`) |
| **AI / Agents** | Google ADK v1 (Gemini, Google Search Tool) |
| **Validation** | Zod v4 |
| **Charts** | Recharts |
| **Package Manager** | pnpm |
| **Linting** | ESLint 9 (flat config) |

---

## AI Pipeline Details

The campaign generator at `app/actions/generator.ts:353` runs three sequential agents:

1. **Research Agent** (`generator.ts:173`) — Caveman-style instructions. Uses `GOOGLE_SEARCH` tool to fetch real-time data. Outputs bullet-point research.
2. **Curator Agent** (`generator.ts:204`) — Structured output via `outputSchema`. Transforms research into a validated `LearningCircuit` JSON matching the schema.
3. **Link Verifier & Repair Loop** (`generator.ts:312`) — Every resource URL is checked with a real HTTP HEAD/GET request (6s timeout). Dead URLs are replaced via a Google Search sub-agent (1 attempt). Failing that, a Google search fallback URL is injected.

The Proof-of-Work Verifier (`generator.ts:431`) uses a separate `LlmAgent` with a strict senior-auditor prompt and structured output (`isVerified`, `feedback`, `confidenceScore`).

---

## Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Make your changes.
4. Run the linter: `pnpm lint`.
5. Commit with a clear message: `git commit -m "feat: add feature X"`.
6. Push: `git push origin feature/your-feature`.
7. Open a Pull Request.

### Coding Guidelines

- Follow existing code conventions (TypeScript strict mode, functional components, server actions for mutations).
- Use `cn()` from `@/lib/utils` for class merging.
- UI primitives go in `components/ui/` — extend from there.
- Server actions go in `app/actions/`.
- Types go in `lib/types.ts`.
- Keep LLM prompts in `generator.ts` concise ("caveman-style") to minimize token usage.

---

## License

[MIT](LICENSE)
