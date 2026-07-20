"use client";

import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ArrowRight, PlayCircle, ChevronDown, X, Target, Zap, Trophy, Flame, ShieldCheck } from 'lucide-react';
import { syncClerkUserToNeon } from '@/app/actions/sync-user';

export interface HeroWaveNavItem {
  label: string;
  href: string;
  hasMenu?: boolean;
}

export interface HeroWaveProps {
  brandName?: string;
  navItems?: HeroWaveNavItem[];
  ctaText?: string;
  ctaHref?: string;
  eyebrowText?: string;
  title?: string;
  description?: string;
  primaryText?: string;
  primaryHref?: string;
  bottomLabel?: string;
  usersText?: string;
}

const defaultNavItems: HeroWaveNavItem[] = [
  { label: 'My Campaigns', href: '/campaigns', hasMenu: true },
];

const LOGOS = [
  { label: "Campaigns", Icon: Target },
  { label: "Quests", Icon: Zap },
  { label: "XP", Icon: Trophy },
  { label: "Streaks", Icon: Flame },
  { label: "Badges", Icon: ShieldCheck },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.68, bounce: 0 },
  },
};

const contentContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

const contentItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.72, bounce: 0 },
  },
};

function MobileMenuIcon() {
  return (
    <span
      className="h-3.5 w-4 bg-[linear-gradient(to_bottom,currentColor_0_2px,transparent_2px_6px,currentColor_6px_8px,transparent_8px_12px,currentColor_12px_14px)]"
      aria-hidden="true"
    />
  );
}

function FloatingQuestCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
      className="hidden lg:block absolute right-8 top-1/4 w-56 rounded-xl border-2 border-faded-gray bg-paper-white p-4 shadow-sm z-20"
    >
      <p className="text-xs font-bold text-charcoal">Quest: Master React</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-lg bg-[#ce82ff] px-2 py-0.5 text-[10px] font-bold text-white">250 XP</span>
        <span className="text-[10px] font-medium text-pencil-gray">Week 2/8</span>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-pencil-gray">Progress</span>
          <span className="font-bold text-eager-green">42%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div className="h-1.5 w-[42%] rounded-full bg-eager-green" />
        </div>
      </div>
      <div className="absolute right-3 top-3 size-2 rounded-full bg-eager-green" />
    </motion.div>
  );
}

function FloatingXpBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
      className="hidden lg:flex absolute left-12 top-[30%] size-20 flex-col items-center justify-center rounded-full bg-[#ce82ff] shadow-sm z-20"
    >
      <span className="text-lg font-black text-white">250</span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-white/80">XP</span>
    </motion.div>
  );
}

const PARTICLES = [
  { x: "8%", y: "15%", size: 6, delay: 0, color: "bg-storybook-green" },
  { x: "92%", y: "12%", size: 4, delay: 0.3, color: "bg-storybook-green" },
  { x: "15%", y: "28%", size: 8, delay: 0.6, color: "bg-storybook-green" },
  { x: "85%", y: "22%", size: 5, delay: 0.9, color: "bg-eager-green/30" },
  { x: "20%", y: "45%", size: 3, delay: 1.2, color: "bg-storybook-green" },
  { x: "75%", y: "40%", size: 7, delay: 1.5, color: "bg-eager-green/20" },
  { x: "10%", y: "60%", size: 4, delay: 1.8, color: "bg-storybook-green" },
  { x: "90%", y: "55%", size: 5, delay: 2.1, color: "bg-storybook-green" },
  { x: "50%", y: "10%", size: 3, delay: 2.4, color: "bg-eager-green/25" },
  { x: "30%", y: "75%", size: 6, delay: 2.7, color: "bg-storybook-green" },
  { x: "70%", y: "70%", size: 4, delay: 3.0, color: "bg-eager-green/20" },
  { x: "45%", y: "50%", size: 8, delay: 3.3, color: "bg-storybook-green" },
  { x: "60%", y: "30%", size: 3, delay: 3.6, color: "bg-storybook-green" },
  { x: "25%", y: "85%", size: 5, delay: 3.9, color: "bg-eager-green/15" },
  { x: "80%", y: "80%", size: 6, delay: 4.2, color: "bg-storybook-green" },
];

const SPARKLES = [
  { x: "12%", y: "35%", delay: 0.5, size: "size-2.5" },
  { x: "88%", y: "50%", delay: 1.0, size: "size-2" },
  { x: "35%", y: "18%", delay: 1.5, size: "size-3" },
  { x: "65%", y: "65%", delay: 2.0, size: "size-2" },
  { x: "50%", y: "80%", delay: 2.5, size: "size-2.5" },
];

function DecorativeDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.7, 0.4, 0.8, 0.3], scale: [0, 1, 0.8, 1.1, 0.9] }}
          transition={{
            duration: 4 + (i % 3),
            delay: p.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className={`absolute rounded-full ${p.color}`}
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
        />
      ))}
      {SPARKLES.map((s, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 3,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute ${s.size}`}
          style={{ left: s.x, top: s.y }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
            <path
              d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"
              fill="#58cc02"
              opacity="0.4"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

function WaveBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <svg
        viewBox="0 0 1440 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Layer 1 — faint distant mountain */}
        <path
          d="M0 400 C180 520 360 280 540 440 C720 600 900 350 1080 480 C1260 610 1350 420 1440 460 L1440 1080 L0 1080 Z"
          fill="#58cc02"
          opacity="0.04"
        />
        {/* Layer 2 — soft rolling hill */}
        <path
          d="M0 500 C240 650 400 380 640 540 C880 700 1040 450 1280 580 C1360 620 1400 520 1440 550 L1440 1080 L0 1080 Z"
          fill="#58cc02"
          opacity="0.08"
        />
        {/* Layer 3 — medium swell */}
        <path
          d="M0 600 C200 750 420 500 660 650 C900 800 1100 550 1300 680 C1380 720 1420 620 1440 640 L1440 1080 L0 1080 Z"
          fill="#58cc02"
          opacity="0.15"
        />
        {/* Layer 4 — strong crest */}
        <path
          d="M0 700 C300 850 500 620 750 760 C1000 900 1150 680 1350 800 C1400 830 1420 740 1440 760 L1440 1080 L0 1080 Z"
          fill="#58cc02"
          opacity="0.30"
        />
        {/* Layer 5 — bold wave */}
        <path
          d="M0 800 C200 920 380 740 580 860 C780 980 960 800 1160 900 C1260 940 1360 860 1440 880 L1440 1080 L0 1080 Z"
          fill="#58cc02"
          opacity="0.50"
        />
        {/* Layer 6 — solid eager green base */}
        <path
          d="M0 920 C180 1020 360 920 540 1000 C720 1080 900 980 1080 1060 C1260 1100 1350 1000 1440 1020 L1440 1080 L0 1080 Z"
          fill="#58cc02"
        />
      </svg>
    </div>
  );
}

export default function HeroWave({
  brandName = 'sana',
  navItems = defaultNavItems,
  eyebrowText = 'Not Your Ordinary Todo List',
  title = 'Boost Your Productivity <br/> with the Help of AI',
  description = 'Sana turns big ambitions into weekly quests. Earn XP, level up, and let AI keep you honest — no spreadsheets, no guilt, just progress.',
  primaryText = 'Start Your Quest',
  primaryHref = '/dashboard',
  usersText = 'Join 10,000+ players already leveling up',
}: HeroWaveProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useAuth();

  const effectiveNavItems = isSignedIn
    ? [{ label: 'Dashboard', href: '/dashboard' }, ...navItems]
    : navItems;

  useEffect(() => {
    if (isSignedIn) {
      syncClerkUserToNeon()
        .then((res) => {
          if (res.success) {
            console.log("🟢 [Sync] User profile synced to Neon.");
          } else {
            console.error("🔴 [Sync] Failed to save user to database:", res.error);
          }
        })
        .catch((err) => console.error("🔴 [Sync] Failed to call Server Action:", err));
    }
  }, [isSignedIn]);

  return (
    <section className="relative min-h-screen w-full bg-paper-white font-duolingo-sans text-charcoal antialiased">
      <WaveBackground />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-paper-white/10 pointer-events-none" />
      <DecorativeDots />
      <FloatingQuestCard />
      <FloatingXpBadge />

      <div className="relative z-30 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-5 sm:px-10 lg:px-[74px]">
        <motion.header
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          className="flex h-12 items-center justify-between"
        >
          <a
            href="/"
            className="inline-flex min-h-10 items-center gap-2 transition-[opacity,transform] duration-200 ease-out hover:opacity-75 active:scale-[0.96]"
          >
            <Image src="/assets/logo/logo.svg" alt={brandName} width={32} height={32} className="h-8 w-auto" />
            <span className="font-feather text-xl font-black tracking-[-0.02em] text-eager-green">
              {brandName}
            </span>
          </a>

          <nav className="hidden items-center gap-2 lg:flex">
            {effectiveNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-faded-gray px-4 py-1 text-nav-label font-bold uppercase tracking-[0.0530em] text-pencil-gray transition-colors duration-200 ease-out hover:border-charcoal hover:text-charcoal"
              >
                <span>{item.label}</span>
                {item.hasMenu ? (
                  <ChevronDown className="size-2.5 transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
                ) : null}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden min-h-10 items-center rounded-xl border-2 border-faded-gray bg-transparent px-4 text-nav-label font-bold uppercase tracking-[0.0530em] text-spark-blue transition-colors duration-200 ease-out hover:bg-storybook-green/30 sm:inline-flex">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden min-h-10 items-center gap-2 rounded-xl bg-eager-green px-5 text-nav-label font-bold uppercase tracking-[0.0530em] text-white transition-[background-color,transform] duration-200 ease-out hover:bg-[#4db802] active:scale-[0.96] sm:inline-flex">
                  <span>Sign Up</span>
                  <ArrowRight className="size-3" />
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>

            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-xl border-2 border-faded-gray bg-paper-white text-pencil-gray transition-colors duration-200 ease-out hover:border-charcoal hover:text-charcoal lg:hidden"
            >
              <MobileMenuIcon />
            </button>
          </div>
        </motion.header>

        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-4 z-50 rounded-xl border-2 border-faded-gray bg-paper-white p-4 text-charcoal lg:hidden"
            >
              <div className="flex items-center justify-between pl-3">
                <a
                  href="/"
                  className="inline-flex items-center gap-2"
                >
                  <Image src="/assets/logo/logo.svg" alt={brandName} width={28} height={28} className="h-7 w-auto" />
                  <span className="font-feather text-lg font-black tracking-[-0.02em] text-eager-green">
                    {brandName}
                  </span>
                </a>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-xl text-pencil-gray transition-colors duration-200 ease-out hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-5 grid gap-1">
                {effectiveNavItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 items-center justify-between rounded-xl px-3 text-nav-label font-bold uppercase tracking-[0.0530em] text-pencil-gray transition-colors duration-200 ease-out hover:bg-muted"
                  >
                    <span>{item.label}</span>
                    {item.hasMenu ? <ChevronDown className="size-3" /> : null}
                  </a>
                ))}
              </nav>

              <Show when="signed-out">
                <div className="mt-4 grid gap-2">
                  <SignInButton mode="modal">
                    <button className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-faded-gray bg-transparent px-5 text-nav-label font-bold uppercase tracking-[0.0530em] text-spark-blue">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-eager-green px-5 text-nav-label font-bold uppercase tracking-[0.0530em] text-white">
                      Sign Up
                      <ArrowRight className="size-3" />
                    </button>
                  </SignUpButton>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="mt-4 flex justify-center">
                  <UserButton />
                </div>
              </Show>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.42 }}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex min-h-7 items-center gap-2 rounded-xl border-2 border-faded-gray bg-paper-white/80 px-3.5 text-caption font-bold text-pencil-gray backdrop-blur-sm"
          >
            <span className="grid size-4 place-items-center rounded-full bg-eager-green">
              <span className="size-2 rounded-full bg-paper-white" />
            </span>
            <span>{eyebrowText}</span>
          </motion.div>

          <motion.h1
            variants={contentItem}
            className="mt-4 font-feather text-4xl font-black tracking-[-0.02em] text-balance whitespace-pre-line text-eager-green sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={contentItem}
            className="mt-5 max-w-2xl text-body leading-body text-pencil-gray"
          >
            {description}
          </motion.p>

          <motion.div
            variants={contentItem}
            className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
          >
            <motion.a
              href={primaryHref}
              whileTap={{ scale: 0.96 }}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-eager-green px-6 text-nav-label font-bold uppercase tracking-[0.0530em] text-paper-white transition-colors hover:bg-[#4db802] sm:w-auto"
            >
              {primaryText}
              <ArrowRight className="size-3" />
            </motion.a>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-faded-gray bg-paper-white/80 px-6 text-nav-label font-bold uppercase tracking-[0.0530em] text-spark-blue transition-colors hover:bg-storybook-green/30 backdrop-blur-sm sm:w-auto">
                  <PlayCircle className="size-4" />
                  Watch Demo
                </button>
              </SignInButton>
            </Show>
          </motion.div>

          <motion.div
            variants={contentItem}
            className="mt-16 w-full"
          >
            <p className="text-caption font-bold tracking-wide text-pencil-gray/60 uppercase">
              What you'll conquer
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
              {LOGOS.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-pencil-gray/70 transition-colors hover:text-charcoal"
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="text-subheading font-bold tracking-tight">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="pb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex w-fit items-center gap-3 rounded-xl border-2 border-faded-gray bg-paper-white/80 p-1 pr-4 text-caption font-bold text-pencil-gray backdrop-blur-sm"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-eager-green text-paper-white">
              <ArrowRight className="size-3" />
            </span>
            <span>{usersText}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
