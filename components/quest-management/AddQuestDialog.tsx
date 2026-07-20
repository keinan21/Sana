"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import type { Quest } from "@/lib/types";

interface ResourceInput {
  platform: string;
  title: string;
  url: string;
}

interface AddQuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    title: string;
    description?: string;
    idealDaysToComplete?: number;
    tasks: { text: string }[];
    resources?: ResourceInput[];
  }) => Promise<void>;
  initialQuest?: Quest;
  initialResources?: ResourceInput[];
  onGenerateResources?: (questTitle: string) => Promise<ResourceInput[]>;
}

let taskKeyCounter = 0;
function nextKey(): number {
  return ++taskKeyCounter;
}

export function AddQuestDialog({
  open,
  onOpenChange,
  onSave,
  initialQuest,
  initialResources,
  onGenerateResources,
}: AddQuestDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [idealDays, setIdealDays] = useState<number>(7);
  const [tasks, setTasks] = useState<{ key: number; text: string }[]>([{ key: nextKey(), text: "" }]);
  const [resources, setResources] = useState<ResourceInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isEditing = !!initialQuest;

  useEffect(() => {
    if (open) {
      if (initialQuest) {
        setTitle(initialQuest.title || "");
        setDescription(initialQuest.description || "");
        setIdealDays(7);
        setTasks(initialQuest.tasks.map((t) => ({ key: nextKey(), text: t.text })));
        setResources(
          (initialResources || []).map((r) => ({
            platform: r.platform,
            title: r.title,
            url: r.url,
          }))
        );
      } else {
        setTitle("");
        setDescription("");
        setIdealDays(7);
        setTasks([{ key: nextKey(), text: "" }]);
        setResources([]);
      }
    }
  }, [open, initialQuest, initialResources]);

  const addTask = () => {
    setTasks((prev) => [...prev, { key: nextKey(), text: "" }]);
  };

  const removeTask = (key: number) => {
    setTasks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((t) => t.key !== key);
    });
  };

  const updateTaskText = (key: number, value: string) => {
    setTasks((prev) => prev.map((t) => (t.key === key ? { ...t, text: value } : t)));
  };

  const addResource = () => {
    setResources((prev) => [...prev, { platform: "", title: "", url: "" }]);
  };

  const removeResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const updateResource = (index: number, field: keyof ResourceInput, value: string) => {
    setResources((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleGenerateResources = async () => {
    if (!title.trim() || !onGenerateResources) return;
    setGenerating(true);
    try {
      const result = await onGenerateResources(title.trim());
      if (result && result.length > 0) {
        setResources((prev) => [...prev, ...result]);
      }
    } finally {
      setGenerating(false);
    }
  };

  const isValid = title.trim().length > 0 && tasks.some((t) => t.text.trim().length > 0);

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        idealDaysToComplete: idealDays,
        tasks: tasks
          .filter((t) => t.text.trim().length > 0)
          .map((t) => ({ text: t.text.trim() })),
        resources: resources.filter((r) => r.platform.trim() || r.url.trim()),
      });
      setTitle("");
      setDescription("");
      setTasks([{ key: nextKey(), text: "" }]);
      setResources([]);
      setIdealDays(7);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-xl w-full p-6 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900">
            {isEditing ? "Edit Quest" : "New Quest"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quest-title" className="text-xs font-medium text-slate-700">
              Quest Title
            </Label>
            <Input
              id="quest-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Learn Godot Basics"
              className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest-desc" className="text-xs font-medium text-slate-700">
              Description <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="quest-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you learn in this quest?"
              className="min-h-[60px] border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quest-days" className="text-xs font-medium text-slate-700">
              Estimated Days <span className="text-slate-400">(optional)</span>
            </Label>
            <Input
              id="quest-days"
              type="number"
              min={1}
              max={90}
              value={idealDays}
              onChange={(e) => setIdealDays(Number(e.target.value))}
              className="w-24 border-2 border-slate-200 bg-white text-slate-900 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          {/* Resources section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">
                Resources <span className="text-slate-400">(optional)</span>
              </Label>
              <div className="flex items-center gap-2">
                {onGenerateResources && (
                  <button
                    type="button"
                    onClick={handleGenerateResources}
                    disabled={generating || !title.trim()}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 disabled:text-slate-300 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate with AI
                  </button>
                )}
                <button
                  type="button"
                  onClick={addResource}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Resource
                </button>
              </div>
            </div>
            {resources.length > 0 && (
              <div className="space-y-2">
                {resources.map((resource, ri) => (
                  <div key={ri} className="flex items-start gap-1.5">
                    <div className="flex-1 grid grid-cols-[120px_1fr] gap-1.5">
                      <Input
                        value={resource.platform}
                        onChange={(e) => updateResource(ri, "platform", e.target.value)}
                        placeholder="Platform"
                        className="border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                      />
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={resource.title}
                          onChange={(e) => updateResource(ri, "title", e.target.value)}
                          placeholder="Title"
                          className="flex-1 border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                        />
                        <Input
                          value={resource.url}
                          onChange={(e) => updateResource(ri, "url", e.target.value)}
                          placeholder="URL"
                          className="flex-[2] border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeResource(ri)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {resources.length === 0 && (
              <p className="text-[11px] text-slate-400">No resources added yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-700">Tasks</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addTask}
                className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.key} className="flex items-center gap-2">
                  <Input
                    value={task.text}
                    onChange={(e) => updateTaskText(task.key, e.target.value)}
                    placeholder={`Task ${tasks.indexOf(task) + 1}`}
                    className="flex-1 border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(task.key)}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Quest"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
