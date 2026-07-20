"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";

interface ReflectionVerificationProps {
  minLength?: number;
  onSubmitReflection: (text: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerified?: () => void;
}

export function ReflectionVerification({ minLength = 100, onSubmitReflection, onVerified }: ReflectionVerificationProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [feedback, setFeedback] = useState<{ isVerified: boolean; feedback: string; confidenceScore: number } | null>(null);

  const charCount = text.length;
  const meetsMin = charCount >= minLength;

  const handleSubmit = async () => {
    if (!meetsMin) return;
    setSubmitting(true);
    setFeedback(null);
    const result = await onSubmitReflection(text.trim());
    if (result.success) {
      setFeedback({
        isVerified: result.isVerified || false,
        feedback: result.feedback || "No feedback provided.",
        confidenceScore: result.confidenceScore || 0,
      });
      if (result.isVerified) {
        setVerified(true);
        setTimeout(() => onVerified?.(), 1500);
      }
    } else {
      setFeedback({
        isVerified: false,
        feedback: result.error || "Failed to verify reflection.",
        confidenceScore: 0,
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700">
          Reflection / Key Takeaways
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you learn? How did you apply the concept? What challenges did you face and how did you overcome them?"
          className="w-full min-h-[160px] p-3 border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs resize-none rounded-xl"
          disabled={submitting || verified}
        />
        <div className="flex items-center justify-between text-xs">
          <span className={`font-mono ${meetsMin ? 'text-emerald-600' : 'text-slate-400'}`}>
            {charCount} / {minLength} minimum characters
          </span>
          {!meetsMin && charCount > 0 && (
            <span className="text-amber-600">{minLength - charCount} more needed</span>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border-2 text-xs space-y-2 ${
          feedback.isVerified
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isVerified ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-600" />
            )}
            <span className={`font-semibold ${feedback.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {feedback.isVerified ? 'Reflection Approved' : 'Reflection Needs Revision'}
            </span>
            <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${
              feedback.isVerified
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {feedback.confidenceScore}% confidence
            </span>
          </div>
          <p className={`leading-relaxed whitespace-pre-wrap ${feedback.isVerified ? 'text-emerald-600' : 'text-amber-700'}`}>
            {feedback.feedback}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!meetsMin || submitting || verified}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
        >
          {verified ? (
            <><CheckCircle className="w-3 h-3 mr-1.5" /> ✓ Verified & Locked</>
          ) : submitting ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Reviewing Reflection...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Submit Reflection for Review</>
          )}
        </Button>
      </div>
    </div>
  );
}
