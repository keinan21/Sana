"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateLearningCampaign, type LearningCircuitInput, type ExperienceLevel } from "@/app/actions/generator";
import { createDatabaseCampaign } from "@/app/actions/db-campaigns";
import { getApiKey, getSelectedModel } from "@/components/ui/api-key-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlobalNavbar from "@/components/global-navbar";
import { ApiKeyDialog } from "@/components/ui/api-key-dialog";
import { Settings, Sparkles, Target, Zap } from "lucide-react";

const GridLoader = dynamic(() => import("@/components/ui/spinner-10"), { ssr: false });

const EXPERIENCE_LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERT", label: "Expert" },
];

const initialFormState: LearningCircuitInput = {
  userGoal: "",
  expectations: "",
  experienceLevel: "BEGINNER",
  weeklyHoursCommitment: 5,
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState<LearningCircuitInput>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateForm = <K extends keyof LearningCircuitInput>(key: K, value: LearningCircuitInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = form.userGoal.trim().length > 0 && form.expectations.trim().length > 0;

  const handleStartCircuit = async () => {
    if (!isFormValid) return;

    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return
    }

    const selectedModel = getSelectedModel()

    setLoading(true);
    setErrorMessage("");

    let navigated = false;

    try {
      const result = await generateLearningCampaign(form, apiKey, selectedModel, isLiteMode);
      if (result.success && result.data) {
        const dbResult = await createDatabaseCampaign(result.data, isLiteMode);
        if (dbResult.success && dbResult.data) {
          navigated = true;
          router.push(`/campaign/${dbResult.data.id}`);
        } else {
          setErrorMessage(dbResult.error || "Failed to save campaign.");
        }
      } else {
        setErrorMessage(result.error || "Failed to generate campaign.");
      }
    } catch {
      setErrorMessage("Failed to generate campaign. Please try again.");
    } finally {
      if (!navigated) setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <GridLoader size={56} color="#10b981" mode="stagger" speed="normal" rounded />
            <p className="text-sm font-medium text-slate-700">
              Generating your todo list, please wait...
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <GlobalNavbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Target className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">New Campaign</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define your learning goal and we will build a structured circuit.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowApiKeyDialog(true)}
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
              aria-label="API & Model Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-xs font-medium text-slate-700">
                Learning Goal
              </Label>
              <Input
                id="goal"
                value={form.userGoal}
                onChange={(e) => updateForm("userGoal", e.target.value)}
                placeholder="e.g. Create a game with Godot"
                className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectations" className="text-xs font-medium text-slate-700">
                Expected Outcome
              </Label>
              <Textarea
                id="expectations"
                value={form.expectations}
                onChange={(e) => updateForm("expectations", e.target.value)}
                placeholder="e.g. A working Mega Man-like platformer"
                className="min-h-[100px] border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level" className="text-xs font-medium text-slate-700">
                  Experience Level
                </Label>
                <Select
                  value={form.experienceLevel}
                  onValueChange={(v: ExperienceLevel) => updateForm("experienceLevel", v)}
                >
                  <SelectTrigger
                    id="level"
                    className="w-full border-2 border-slate-200 bg-white text-slate-900 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                  >
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-slate-200 bg-white">
                    {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-slate-900 focus:bg-slate-100">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-xs font-medium text-slate-700">
                  Weekly Hours
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min={1}
                  max={80}
                  value={form.weeklyHoursCommitment}
                  onChange={(e) => updateForm("weeklyHoursCommitment", Number(e.target.value))}
                  className="w-full border-2 border-slate-200 bg-white text-slate-900 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
              <Switch
                id="lite-mode"
                checked={isLiteMode}
                onCheckedChange={setIsLiteMode}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="lite-mode" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  <Zap className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
                  Lite Mode (Fast & Resource-Free)
                </Label>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Turns off AI resource gathering. Recommended to avoid API rate limits and speed up generation.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <Button
              onClick={handleStartCircuit}
              disabled={loading || !isFormValid}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 border-2 border-emerald-700 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
            >
              {loading ? (
                isLiteMode ? "Generating Circuit... (Lite Mode)" : "Generating Circuit... (Researching & Curating)"
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Execute Strategy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      </div>
    </>
  );
}
