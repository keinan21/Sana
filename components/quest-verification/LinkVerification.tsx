"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Sparkles, ExternalLink } from "lucide-react";

const ACCEPTED_PLATFORMS = ["GitHub", "X (Twitter)", "LinkedIn", "Medium", "personal blogs"];

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface LinkVerificationProps {
  questTitle: string;
  linkInstructions?: string;
  onSubmitUrl: (url: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onVerified?: () => void;
}

export function LinkVerification({
  questTitle,
  linkInstructions,
  onSubmitUrl,
  onVerified,
}: LinkVerificationProps) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [feedback, setFeedback] = useState<{ isVerified: boolean; feedback: string; confidenceScore: number } | null>(null);

  const validUrl = isValidUrl(url);

  const handleSubmit = async () => {
    if (!url.trim() || !validUrl) return;
    setSubmitting(true);
    setFeedback(null);

    const result = await onSubmitUrl(url.trim());
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
        feedback: result.error || "Failed to verify submission.",
        confidenceScore: 0,
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Quest-specific link instructions */}
      {linkInstructions && (
        <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-amber-800 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Required Submission
          </p>
          <p className="text-amber-700 leading-relaxed">{linkInstructions}</p>
        </div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700">
          Public Link
        </Label>
        <Input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setFeedback(null); }}
          placeholder="Paste your public link (GitHub, X, LinkedIn, Medium, blog...)"
          className="w-full p-3 border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs rounded-xl"
          disabled={submitting || verified}
        />
        {url && !validUrl && (
          <p className="text-xs text-red-500 font-medium">
            Please enter a valid URL starting with http:// or https://
          </p>
        )}
        {validUrl && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            Preview link
          </a>
        )}
        <p className="text-[10px] text-slate-400">
          Accepted: {ACCEPTED_PLATFORMS.join(", ")}. If the AI cannot access your link, try explaining what you built in an essay instead.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border-2 text-xs space-y-2 ${
          feedback.isVerified
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isVerified ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`font-semibold ${feedback.isVerified ? 'text-emerald-700' : 'text-red-700'}`}>
              {feedback.isVerified ? 'Submission Verified' : 'Submission Rejected'}
            </span>
            <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${
              feedback.isVerified
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-red-100 text-red-600'
            }`}>
              {feedback.confidenceScore}% confidence
            </span>
          </div>
          <p className={`leading-relaxed ${feedback.isVerified ? 'text-emerald-600' : 'text-red-600'}`}>
            {feedback.feedback}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || verified || !validUrl}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
        >
          {verified ? (
            <><CheckCircle className="w-3 h-3 mr-1.5" /> ✓ Verified & Locked</>
          ) : submitting ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Submit for Review</>
          )}
        </Button>
      </div>
    </div>
  );
}