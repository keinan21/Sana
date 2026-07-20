"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateLearningCampaign, type LearningCircuitInput, type ExperienceLevel } from "@/app/actions/generator";
import { createDatabaseCampaign, createEmptyCampaign } from "@/app/actions/db-campaigns";
import { getApiKey, getSelectedModel } from "@/components/ui/api-key-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GlobalNavbar from "@/components/global-navbar";
import { ApiKeyDialog } from "@/components/ui/api-key-dialog";
import { Settings, Sparkles, Target, Zap, ChevronDown, ChevronRight } from "lucide-react";

const GridLoader = dynamic(() => import("@/components/ui/spinner-10"), { ssr: false });

const EXPERIENCE_LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "EXPERT", label: "Expert" },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedWeeks, setEstimatedWeeks] = useState(4);
  const [useAi, setUseAi] = useState(false);
  const [aiExperienceLevel, setAiExperienceLevel] = useState<ExperienceLevel>("BEGINNER");
  const [aiWeeklyHours, setAiWeeklyHours] = useState(5);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFormValid = title.trim().length > 0 && description.trim().length > 0;

  const handleCreateEmpty = async () => {
    if (!isFormValid || loading) return;

    setLoading(true);
    setErrorMessage("");

    let navigated = false;
    try {
      const result = await createEmptyCampaign(title.trim(), description.trim(), estimatedWeeks || undefined);
      if (result.success && result.data) {
        navigated = true;
        router.push(`/campaign/${result.data.id}`);
      } else {
        setErrorMessage(result.error || "Failed to create campaign.");
      }
    } catch {
      setErrorMessage("Failed to create campaign. Please try again.");
    } finally {
      if (!navigated) setLoading(false);
    }
  };

  const handleGenerateAndCreate = async () => {
    if (!isFormValid || loading) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    let navigated = false;
    try {
      const aiInput: LearningCircuitInput = {
        userGoal: title.trim(),
        expectations: description.trim(),
        experienceLevel: aiExperienceLevel,
        weeklyHoursCommitment: aiWeeklyHours,
      };

      const genResult = await generateLearningCampaign(aiInput, apiKey, getSelectedModel(), isLiteMode);
      if (genResult.success && genResult.data) {
        const dbResult = await createDatabaseCampaign(
          { ...genResult.data, title: title.trim(), targetDescription: description.trim() },
          isLiteMode
        );
        if (dbResult.success && dbResult.data) {
          navigated = true;
          router.push(`/campaign/${dbResult.data.id}`);
        } else {
          setErrorMessage(dbResult.error || "Failed to save campaign.");
        }
      } else {
        setErrorMessage(genResult.error || "Failed to generate campaign.");
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
            <p className="text-sm font-bold text-charcoal">
              {useAi ? "Generating your campaign..." : "Creating campaign..."}
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen w-full bg-paper-white text-charcoal">
      <GlobalNavbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border-2 border-faded-gray bg-paper-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-storybook-green">
                <Target className="h-5 w-5 text-eager-green" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-charcoal">New Campaign</h1>
                <p className="text-xs text-pencil-gray mt-0.5">
                  Start with an empty campaign or generate one with AI.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-charcoal">
                Campaign Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Godot Game Development"
                className="w-full border-2 border-faded-gray bg-paper-white text-charcoal placeholder:text-pencil-gray focus-visible:border-eager-green focus-visible:ring-eager-green/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-charcoal">
                What do you want to achieve?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Build a complete 2D platformer game with multiple levels and boss fights"
                className="min-h-[80px] border-2 border-faded-gray bg-paper-white text-charcoal placeholder:text-pencil-gray focus-visible:border-eager-green focus-visible:ring-eager-green/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeks" className="text-xs font-bold text-charcoal">
                Estimated Duration <span className="text-pencil-gray">(weeks, optional)</span>
              </Label>
              <Input
                id="weeks"
                type="number"
                min={1}
                max={52}
                value={estimatedWeeks}
                onChange={(e) => setEstimatedWeeks(Number(e.target.value))}
                className="w-24 border-2 border-faded-gray bg-paper-white text-charcoal focus-visible:border-eager-green focus-visible:ring-eager-green/20"
              />
            </div>

            {/* AI Generate Toggle */}
            <button
              type="button"
              onClick={() => setUseAi(!useAi)}
              className="w-full flex items-center gap-2 rounded-xl border-2 border-faded-gray bg-muted px-4 py-3 text-left text-sm font-bold text-charcoal hover:bg-[#efefef] transition-colors"
            >
              {useAi ? <ChevronDown className="h-4 w-4 text-pencil-gray" /> : <ChevronRight className="h-4 w-4 text-pencil-gray" />}
              <Sparkles className="h-4 w-4 text-[#ff9600]" />
              Generate initial quests with AI
              <span className="ml-auto text-[10px] text-pencil-gray font-medium">{useAi ? "on" : "off"}</span>
            </button>

            {useAi && (
              <div className="rounded-xl border-2 border-faded-gray bg-muted p-4 space-y-4">
                <p className="text-xs text-pencil-gray">
                  AI will use your campaign title and goal to generate a structured curriculum. Adjust your experience level and availability below.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-level" className="text-xs font-bold text-charcoal">
                      Experience Level
                    </Label>
                    <Select
                      value={aiExperienceLevel}
                      onValueChange={(v: ExperienceLevel) => setAiExperienceLevel(v)}
                    >
                      <SelectTrigger
                        id="ai-level"
                        className="w-full border-2 border-faded-gray bg-paper-white text-charcoal focus-visible:border-eager-green focus-visible:ring-eager-green/20"
                      >
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-faded-gray bg-paper-white">
                        {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-charcoal focus:bg-muted">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-hours" className="text-xs font-bold text-charcoal">
                      Weekly Hours
                    </Label>
                    <Input
                      id="ai-hours"
                      type="number"
                      min={1}
                      max={80}
                      value={aiWeeklyHours}
                      onChange={(e) => setAiWeeklyHours(Number(e.target.value))}
                      className="w-full border-2 border-faded-gray bg-paper-white text-charcoal focus-visible:border-eager-green focus-visible:ring-eager-green/20"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border-2 border-faded-gray bg-paper-white p-4">
                  <Switch
                    id="lite-mode"
                    checked={isLiteMode}
                    onCheckedChange={setIsLiteMode}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="lite-mode" className="text-xs font-bold text-charcoal cursor-pointer">
                      <Zap className="inline h-3.5 w-3.5 mr-1 text-[#ff9600]" />
                      Lite Mode (Fast & Resource-Free)
                    </Label>
                    <p className="text-[11px] text-pencil-gray leading-snug">
                      Skips AI research and link verification. Recommended for faster generation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border-2 border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateEmpty}
                disabled={loading || !isFormValid}
                className="flex-1 bg-eager-green hover:bg-[#4db802] text-white font-bold py-5 border-2 border-eager-green transition-all disabled:bg-muted disabled:text-pencil-gray disabled:border-faded-gray"
              >
                <Target className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>

              {useAi && (
                <Button
                  onClick={handleGenerateAndCreate}
                  disabled={loading || !isFormValid}
                  className="flex-1 bg-[#ff9600] hover:bg-[#e68600] text-white font-bold py-5 border-2 border-[#e68600] transition-all disabled:bg-muted disabled:text-pencil-gray disabled:border-faded-gray"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {loading && useAi ? "Generating..." : "Generate & Create"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      </div>
    </>
  );
}
