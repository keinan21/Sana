"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CTASection() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return (
    <section className="bg-eager-green px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-feather text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] font-black tracking-[-0.02em] text-paper-white">
          Ready to Start Playing?
        </h2>
        <p className="mt-3 text-body leading-body font-medium text-fresh-leaf">
          Your first campaign is free. No credit card. No spreadsheet. Just your
          first quest waiting.
        </p>

        <button
          onClick={handleClick}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-paper-white px-6 py-3 text-nav-label font-bold uppercase tracking-[0.0530em] text-eager-green transition-[background-color,transform] duration-200 ease-out hover:bg-[#f0f0f0] active:scale-[0.96]"
        >
          <Sparkles className="h-4 w-4" />
          {isSignedIn ? "Back to the Game" : "Claim Your First Quest"}
        </button>
      </div>

      {/* Footer links */}
      <div className="mx-auto mt-12 max-w-4xl border-t border-fresh-leaf/30 pt-8">
        <div className="grid grid-cols-2 gap-8 text-left sm:grid-cols-4">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.0530em] text-paper-white">
              Product
            </h4>
            <ul className="mt-3 space-y-2">
              {["Features", "Pricing", "FAQ"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm font-medium text-fresh-leaf hover:text-paper-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.0530em] text-paper-white">
              Company
            </h4>
            <ul className="mt-3 space-y-2">
              {["About", "Blog", "Careers"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm font-medium text-fresh-leaf hover:text-paper-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.0530em] text-paper-white">
              Support
            </h4>
            <ul className="mt-3 space-y-2">
              {["Help Center", "Contact", "Status"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm font-medium text-fresh-leaf hover:text-paper-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.0530em] text-paper-white">
              Legal
            </h4>
            <ul className="mt-3 space-y-2">
              {["Privacy", "Terms", "Cookies"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm font-medium text-fresh-leaf hover:text-paper-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm font-medium text-fresh-leaf/60">
          &copy; {new Date().getFullYear()} sana. All rights reserved.
        </div>
      </div>
    </section>
  );
}
