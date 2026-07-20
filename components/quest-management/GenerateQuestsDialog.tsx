"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, Check, Loader2 } from "lucide-react";
import { generateQuests } from "@/app/actions/generator";
import { getApiKey, getSelectedModel } from "@/components/ui/api-key-dialog";
import type { Modul } from "@/lib/types";

interface GenerateQuestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  campaignDescription: string;
  onAddQuests: (quests: Modul[]) => Promise<void>;
  onOpenApiKeyDialog: () => void;
}

const COUNT_OPTIONS = [1, 2, 3, 4, 5];

export function GenerateQuestsDialog({
  open,
  onOpenChange,
  campaignTitle,
  campaignDescription,
  onAddQuests,
  onOpenApiKeyDialog,
}: GenerateQuestsDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [generatedQuests, setGeneratedQuests] = useState<Modul[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [error, setError] = useState("");

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setPrompt("");
      setCount(3);
      setGenerating(false);
      setGeneratedQuests([]);
      setAddedIds(new Set());
      setAddingAll(false);
      setError("");
    }
    onOpenChange(o);
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      onOpenApiKeyDialog();
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedQuests([]);
    setAddedIds(new Set());

    try {
      const result = await generateQuests(
        campaignTitle,
        campaignDescription,
        prompt || "Generate quests for this campaign",
        apiKey,
        getSelectedModel(),
        count
      );

      if (result.success && result.data) {
        setGeneratedQuests(result.data);
      } else {
        setError(result.error || "Failed to generate quests.");
      }
    } catch {
      setError("Failed to generate quests. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSingle = async (quest: Modul) => {
    if (addedIds.has(quest.id)) return;
    await onAddQuests([quest]);
    setAddedIds((prev) => new Set(prev).add(quest.id));
  };

  const handleAddAll = async () => {
    const remaining = generatedQuests.filter((q) => !addedIds.has(q.id));
    if (remaining.length === 0) return;
    setAddingAll(true);
    try {
      await onAddQuests(remaining);
      setAddedIds((prev) => new Set([...prev, ...remaining.map((q) => q.id)]));
    } finally {
      setAddingAll(false);
    }
  };

  const allAdded = generatedQuests.length > 0 && generatedQuests.every((q) => addedIds.has(q.id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-xl w-full p-6 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Generate Quests with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gen-prompt" className="text-xs font-medium text-slate-700">
              What kind of quests do you want?
            </Label>
            <Textarea
              id="gen-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus on practical exercises with real-world examples"
              className="min-h-[80px] border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">Number of Quests</Label>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold border-2 transition-colors ${
                    count === n
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>

          {generatedQuests.length > 0 && (
            <div className="space-y-3 pt-2 border-t-2 border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Generated Quests
                </Label>
                {!allAdded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAll}
                    disabled={addingAll}
                    className="h-7 text-xs border-2 border-slate-200"
                  >
                    {addingAll ? "Adding..." : "Add All to Campaign"}
                  </Button>
                )}
                {allAdded && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    All Added
                  </span>
                )}
              </div>
              {generatedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    addedIds.has(quest.id)
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900">{quest.title}</h4>
                      {quest.description && (
                        <p className="text-xs text-slate-500 mt-1">{quest.description}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        ~{quest.idealDaysToComplete} days
                      </p>
                    </div>
                    {!addedIds.has(quest.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSingle(quest)}
                        className="shrink-0 h-7 text-xs border-2 border-slate-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                        <Check className="h-3 w-3" />
                        Added
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {quest.todos.map((todo) => (
                      <li key={todo.id} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                        {todo.task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
