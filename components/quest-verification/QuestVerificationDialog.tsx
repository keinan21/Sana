"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, CheckCircle } from "lucide-react";
import { ReflectionVerification } from "./ReflectionVerification";
import { EssayVerification } from "./EssayVerification";
import { LinkVerification } from "./LinkVerification";
import type { Quest } from "@/lib/types";

interface QuestVerificationDialogProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerifyReflection: (quest: Quest, text: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerifyEssay: (quest: Quest, essayText: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerifyLink: (quest: Quest, url: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerified: (quest: Quest) => void;
}

const TYPE_LABELS: Record<string, string> = {
  reflection: "Write a brief reflection on what you learned",
  essay: "Submit a written analysis for AI review",
  link: "Submit a public link as proof of work",
};

export function QuestVerificationDialog({
  quest,
  open,
  onOpenChange,
  onVerifyReflection,
  onVerifyEssay,
  onVerifyLink,
  onVerified,
}: QuestVerificationDialogProps) {
  const [verified, setVerified] = useState(false);

  if (!quest) return null;

  const questType = quest.type || "link";
  const label = TYPE_LABELS[questType] || "Submit proof of work";

  const handleVerified = () => {
    setVerified(true);
    setTimeout(() => {
      onVerified(quest);
    }, 1000);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setVerified(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-xl w-full p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {questType === "reflection" && "Reflection Quest"}
            {questType === "essay" && "Essay Quest"}
            {questType === "link" && "Link Quest"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {verified
              ? `Quest "${quest.title}" verified successfully!`
              : `${label} for "${quest.title}"`}
          </DialogDescription>
        </DialogHeader>

        {verified ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Quest Complete!</p>
          </div>
        ) : (
          <>
            {questType === "reflection" && (
              <ReflectionVerification
                minLength={quest.minReflectionLength}
                onSubmitReflection={async (text) => onVerifyReflection(quest, text)}
                onVerified={handleVerified}
              />
            )}
            {questType === "essay" && quest.essayPrompt && (
              <EssayVerification
                questTitle={quest.title}
                essayPrompt={quest.essayPrompt}
                onSubmitEssay={async (essayText) => onVerifyEssay(quest, essayText)}
                onVerified={handleVerified}
              />
            )}
            {questType === "link" && (
              <LinkVerification
                questTitle={quest.title}
                linkInstructions={quest.linkInstructions}
                onSubmitUrl={async (url) => onVerifyLink(quest, url)}
                onVerified={handleVerified}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}