"use client";

import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import { syncClerkUserToNeon } from '@/app/actions/sync-user';

export interface Hero10NavItem {
  label: string;
  href: string;
  hasMenu?: boolean;
}

export interface Hero10Props {
  brandName?: string;
  navItems?: Hero10NavItem[];
  ctaText?: string;
  ctaHref?: string;
  eyebrowText?: string;
  title?: string;
  description?: string;
  primaryText?: string;
  primaryHref?: string;
  bottomLabel?: string;
  usersText?: string;
  backgroundImage?: string;
}

const defaultNavItems: Hero10NavItem[] = [
  { label: 'My Campaigns', href: '/campaigns', hasMenu: true },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -16, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
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
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
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

export default function Hero10({
  brandName = 'sana.ai',
  navItems = defaultNavItems,
  eyebrowText = 'AI-Powered Goal Breaker',
  title = 'Break Your Limits, Not Your Spirit.\nAI-Powered Gamified Goal Achiever.',
  description = 'Sana turns massive life goals into bite-sized weekly quests. Track XP, conquer Kanban boards, and verify progress with AI — all in one place.',
  primaryText = 'Get Started Free',
  primaryHref = '/dashboard',
  usersText = 'Join 10,000+ goal-crushers already building',
}: Hero10Props) {
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
    <section className="relative isolate min-h-screen w-full bg-white font-sans text-slate-900 antialiased overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/hero-bg.avif')] bg-cover bg-center opacity-90"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-[1440px] flex-col px-5 py-5 sm:min-h-screen sm:px-10 lg:px-[74px]">
        <motion.header
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          className="flex h-12 items-center justify-between"
        >
          <a
            href="#"
            className="inline-flex min-h-10 items-center transition-[opacity,transform] duration-200 ease-out hover:opacity-75 active:scale-[0.96]"
          >
            <img src="/logo_icon.png" alt={brandName} className="h-8 w-auto" />
          </a>

          <nav className="hidden items-center gap-[54px] lg:flex">
            {effectiveNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group inline-flex min-h-10 items-center gap-1.5 text-sm leading-none font-normal text-slate-800 transition-colors duration-200 ease-out hover:text-slate-500"
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
                <button className="hidden min-h-10 items-center rounded-xl border-2 border-slate-900 bg-white px-4 text-sm leading-none font-medium text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-100 active:scale-[0.96] sm:inline-flex">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden min-h-10 items-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-400 px-5 text-sm leading-none font-semibold text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-amber-500 active:scale-[0.96] sm:inline-flex">
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
              className="inline-flex size-10 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-100 active:scale-[0.96] lg:hidden"
            >
              <MobileMenuIcon />
            </button>
          </div>
        </motion.header>

        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-4 z-50 rounded-2xl border-2 border-slate-200 bg-white p-4 text-slate-900 lg:hidden"
            >
              <div className="flex items-center justify-between pl-3">
                <a
                  href="#"
                  className="inline-flex items-center"
                >
                  <img src="/logo_icon.png" alt={brandName} className="h-7 w-auto" />
                </a>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-full text-slate-950 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-950/5 active:scale-[0.96]"
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
                    className="inline-flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm font-medium text-slate-900 transition-colors duration-200 ease-out hover:bg-slate-950/5"
                  >
                    <span>{item.label}</span>
                    {item.hasMenu ? <ChevronDown className="size-3" /> : null}
                  </a>
                ))}
              </nav>

              <Show when="signed-out">
                <div className="mt-4 grid gap-2">
                  <SignInButton mode="modal">
                    <button className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 text-sm font-medium text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-100">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-amber-400 px-5 text-sm font-semibold text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-amber-500">
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
          className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center pt-[76px] text-center sm:pt-[94px] lg:pt-[68px]"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex min-h-7 items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-100 px-3.5 text-[11px] leading-none font-semibold text-emerald-800"
          >
            <span className="grid size-4 place-items-center rounded-full bg-emerald-400">
              <span className="size-2 rounded-full bg-emerald-700" />
            </span>
            <span>{eyebrowText}</span>
          </motion.div>

          <motion.h1
            variants={contentItem}
            className="mt-5 max-w-5xl font-serif text-[clamp(3.25rem,4.8vw,5.35rem)] leading-[0.92] font-medium tracking-[-0.07em] text-balance whitespace-pre-line text-slate-900"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={contentItem}
            className="mt-6 max-w-[570px] text-[clamp(1rem,1.35vw,1.16rem)] leading-[1.42] font-normal text-pretty whitespace-pre-line text-slate-600"
          >
            {description}
          </motion.p>

          <motion.a
            href={primaryHref}
            variants={contentItem}
            whileTap={{ scale: 0.96 }}
            className="text-md mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-amber-600 bg-amber-400 px-5 font-semibold text-slate-900 transition-[background-color,transform] duration-200 ease-out hover:bg-amber-500"
          >
            <span>{primaryText}</span>
            <ArrowRight className="size-3" />
          </motion.a>
        </motion.div>

        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-0 flex flex-col items-center gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between"
        >
          <motion.div
            variants={contentItem}
            className="inline-flex w-fit items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-1 pr-4 text-sm font-semibold text-emerald-800"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-400 text-white">
              <ArrowRight className="size-3" />
            </span>
            <span>{usersText}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}