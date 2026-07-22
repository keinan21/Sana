"use client";

import { type FC, useEffect, useState, useRef, useCallback } from "react";

export interface FluidTabItem {
  id: string;
  label: string;
  count?: number;
}

interface FluidTabsProps {
  tabs: FluidTabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
  activeColor?: string;
}

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
  activeColor = "#58cc02",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setButtonRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      buttonRefs.current.set(id, el);
    } else {
      buttonRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const btn = buttonRefs.current.get(activeTab || "");
    if (!btn) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [activeTab, tabs]);

  const isYellow = activeColor === "#ffc800" || activeColor === "#e5b200";

  return (
    <div
      className="z-[9999] pointer-events-none flex justify-center px-4 md:hidden"
      style={{ position: "fixed", bottom: "1.5rem", left: 0, right: 0 }}
    >
      <div
        ref={containerRef}
        className={`pointer-events-auto relative flex items-center justify-around gap-1 p-1.5 rounded-full w-full max-w-sm bg-white/95 backdrop-blur-md border-2 border-[#afafaf] shadow-[0_8px_20px_rgba(0,0,0,0.18)] ${className}`}
      >
        {indicatorStyle && (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full border-b-2 border-black/20 shadow-md transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              backgroundColor: activeColor,
            }}
          />
        )}

        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const activeTextColor = isYellow ? "text-zinc-900" : "text-white";
          const activeBadgeBg = isYellow ? "bg-black/15 text-zinc-900" : "bg-white/25 text-white";

          return (
            <button
              key={tab.id}
              ref={(el) => setButtonRef(tab.id, el)}
              onClick={() => onChange?.(tab.id)}
              className="relative flex-1 rounded-full py-2 px-2 outline-none transition-transform duration-150 active:scale-95"
            >
              <span
                className={`relative z-10 flex items-center justify-center gap-1.5 font-bold tracking-[0.03em] uppercase text-[11px] transition-colors duration-200 ${
                  isActive ? activeTextColor : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums transition-colors duration-200 ${
                      isActive
                        ? activeBadgeBg
                        : "bg-zinc-200/80 text-zinc-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
