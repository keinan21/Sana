"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Sparkles, ExternalLink, ImageIcon } from "lucide-react";

const IMAGE_PLATFORMS = [
  "instagram.com",
  "imgur.com",
  "flickr.com",
  "500px.com",
  "unsplash.com",
  "deviantart.com",
  "artstation.com",
  "pinterest.com",
  "behance.net",
  "dribbble.com",
  "tinypic.com",
  "photobucket.com",
  "imgbb.com",
  "postimg.cc",
];

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i;

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isImagePlatform(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return IMAGE_PLATFORMS.some((p) => hostname === p || hostname.endsWith("." + p));
  } catch {
    return false;
  }
}

function isDirectImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url);
}

interface ProjectVerificationProps {
  questTitle: string;
  proofInstructions?: string;
  onSubmitUrl: (url: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
  onSubmitDescription: (label: string, description: string) => Promise<{ success: boolean; isVerified?: boolean; feedback?: string; confidenceScore?: number; error?: string }>;
}

export function ProjectVerification({
  questTitle,
  proofInstructions,
  onSubmitUrl,
  onSubmitDescription,
}: ProjectVerificationProps) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isVerified: boolean; feedback: string; confidenceScore: number } | null>(null);

  const validUrl = isValidUrl(url);
  const isImageLink = validUrl && (isImagePlatform(url) || isDirectImageUrl(url));

  const handleSubmit = async () => {
    if (!url.trim() || !validUrl) return;
    setSubmitting(true);
    setFeedback(null);

    if (isImageLink) {
      if (!description.trim()) {
        setSubmitting(false);
        return;
      }
      const result = await onSubmitDescription(
        `Visual post: ${url}`,
        description.trim()
      );
      if (result.success) {
        setFeedback({
          isVerified: result.isVerified || false,
          feedback: result.feedback || "No feedback provided.",
          confidenceScore: result.confidenceScore || 0,
        });
      } else {
        setFeedback({
          isVerified: false,
          feedback: result.error || "Failed to verify submission.",
          confidenceScore: 0,
        });
      }
    } else {
      const result = await onSubmitUrl(url.trim());
      if (result.success) {
        setFeedback({
          isVerified: result.isVerified || false,
          feedback: result.feedback || "No feedback provided.",
          confidenceScore: result.confidenceScore || 0,
        });
      } else {
        setFeedback({
          isVerified: false,
          feedback: result.error || "Failed to verify submission.",
          confidenceScore: 0,
        });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Quest-specific proof instructions */}
      {proofInstructions && (
        <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs space-y-1">
          <p className="font-semibold text-amber-800 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Required Submission
          </p>
          <p className="text-amber-700 leading-relaxed">{proofInstructions}</p>
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
          placeholder="Paste your public submission link here (GitHub, LinkedIn, Medium, etc.)"
          className="w-full p-3 border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs rounded-xl"
          disabled={submitting}
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
      </div>

      {/* Image-based URL fallback: text description */}
      {isImageLink && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <ImageIcon className="w-3.5 h-3.5" />
            Image-based platform detected
          </div>
          <Label className="text-xs font-semibold text-slate-700">
            Describe What You Created
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Since we can't view images directly, please describe what you posted or created in detail. What did you make? What tools did you use? What was your process?"
            className="w-full min-h-[120px] p-3 border-2 border-amber-200 bg-amber-50/50 text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs resize-none rounded-xl"
            disabled={submitting}
          />
          <p className="text-xs text-amber-600 font-mono">
            {description.length} characters
          </p>
        </div>
      )}

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
          disabled={submitting || !validUrl || (isImageLink && !description.trim())}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
        >
          {submitting ? (
            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...</>
          ) : (
            <><Sparkles className="w-3 h-3 mr-1.5" /> Submit for Review</>
          )}
        </Button>
      </div>
    </div>
  );
}
