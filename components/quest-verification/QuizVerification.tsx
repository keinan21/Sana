"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { QuizQuestion } from "@/lib/types";

interface QuizVerificationProps {
  quizData: QuizQuestion[];
  onVerified: () => void;
}

export function QuizVerification({ quizData, onVerified }: QuizVerificationProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [incorrect, setIncorrect] = useState<string[]>([]);

  const allAnswered = quizData.every((q) => answers[q.id] !== undefined);

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    const wrong = quizData.filter((q) => answers[q.id] !== q.correctAnswer).map((q) => q.id);
    setIncorrect(wrong);
    setSubmitted(true);
    if (wrong.length === 0) {
      setPassed(true);
      setTimeout(() => onVerified(), 1500);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {quizData.map((q, qi) => {
        const selected = answers[q.id];
        const isWrong = submitted && incorrect.includes(q.id);
        const isRight = submitted && !incorrect.includes(q.id);
        return (
          <div key={q.id} className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              {qi + 1}. {q.question}
            </Label>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                let optionClass =
                  "w-full text-left px-3 py-2 rounded-xl border-2 text-xs transition-colors text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50";
                if (submitted) {
                  if (oi === q.correctAnswer) {
                    optionClass =
                      "w-full text-left px-3 py-2 rounded-xl border-2 text-xs border-emerald-400 bg-emerald-50 text-emerald-700";
                  } else if (oi === selected && isWrong) {
                    optionClass =
                      "w-full text-left px-3 py-2 rounded-xl border-2 text-xs border-red-400 bg-red-50 text-red-700";
                  } else {
                    optionClass =
                      "w-full text-left px-3 py-2 rounded-xl border-2 text-xs text-slate-400 border-slate-100";
                  }
                } else if (oi === selected) {
                  optionClass =
                    "w-full text-left px-3 py-2 rounded-xl border-2 text-xs border-emerald-400 bg-emerald-50 text-emerald-700";
                }
                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(q.id, oi)}
                    className={optionClass}
                    disabled={submitted}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {submitted && passed && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
          <CheckCircle className="w-4 h-4" />
          All answers correct!
        </div>
      )}

      {submitted && !passed && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          <XCircle className="w-4 h-4" />
          Some answers are incorrect. Review and try again.
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={submitted && !passed ? () => { setSubmitted(false); setPassed(false); setIncorrect([]); } : handleSubmit}
          disabled={!allAnswered}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
        >
          {submitted && !passed ? "Retry Quiz" : "Submit Answers"}
        </Button>
      </div>
    </div>
  );
}
