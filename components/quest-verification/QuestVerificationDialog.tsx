"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, CheckCircle } from "lucide-react";
import { QuizVerification } from "./QuizVerification";
import { ReflectionVerification } from "./ReflectionVerification";
import { IdeationVerification } from "./IdeationVerification";
import { ProjectVerification } from "./ProjectVerification";
import type { Quest } from "@/lib/types";

interface QuestVerificationDialogProps {
  quest: Quest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerifyIdeation: (quest: Quest, ideaText: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerifyProject: (quest: Quest, url: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerifyProjectDescription: (quest: Quest, label: string, description: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerified: (quest: Quest) => void;
}

const TYPE_LABELS: Record<string, string> = {
  quiz: "Answer the quiz questions to pass this quest",
  reflection: "Write your reflection and key takeaways",
  ideation: "Describe your idea or plan for AI review",
  project: "Submit a public link as proof of work",
};

export function QuestVerificationDialog({
  quest,
  open,
  onOpenChange,
  onVerifyIdeation,
  onVerifyProject,
  onVerifyProjectDescription,
  onVerified,
}: QuestVerificationDialogProps) {
  const [verified, setVerified] = useState(false);

  if (!quest) return null;

  const questType = quest.type || "project";
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
            {questType === "quiz" && "Quiz Quest"}
            {questType === "reflection" && "Reflection Quest"}
            {questType === "ideation" && "Ideation Quest"}
            {questType === "project" && "Project Quest"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {verified
              ? `Quest "${quest.title}" verified successfully!`
              : `${label} for "${quest.title}"`
            }
          </DialogDescription>
        </DialogHeader>

        {verified ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Quest Complete!</p>
          </div>
        ) : (
          <>
            {questType === "quiz" && quest.quizData && (
              <QuizVerification
                quizData={quest.quizData}
                onVerified={handleVerified}
              />
            )}
            {questType === "reflection" && (
              <ReflectionVerification
                minLength={quest.minReflectionLength}
                onVerified={handleVerified}
              />
            )}
            {questType === "ideation" && (
              <IdeationVerification
                questTitle={quest.title}
                onSubmitIdea={async (ideaText) => onVerifyIdeation(quest, ideaText)}
              />
            )}
            {questType === "project" && (
              <ProjectVerification
                questTitle={quest.title}
                proofInstructions={quest.proofInstructions}
                onSubmitUrl={async (url) => onVerifyProject(quest, url)}
                onSubmitDescription={async (label, description) => onVerifyProjectDescription(quest, label, description)}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
