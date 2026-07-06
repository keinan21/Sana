"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

interface ReflectionVerificationProps {
  minLength?: number;
  onVerified: () => void;
}

export function ReflectionVerification({ minLength = 100, onVerified }: ReflectionVerificationProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const charCount = text.length;
  const meetsMin = charCount >= minLength;

  const handleSubmit = () => {
    if (!meetsMin) return;
    setSubmitted(true);
    setTimeout(() => onVerified(), 1000);
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
          disabled={submitted}
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

      {submitted && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
          <CheckCircle className="w-4 h-4" />
          Reflection submitted successfully!
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!meetsMin || submitted}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
        >
          Submit Reflection
        </Button>
      </div>
    </div>
  );
}
