"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { verifyModulProgress } from "@/app/actions/generator";
import {
  getDatabaseCampaignById,
  updateDatabaseCampaignProgress,
  toggleQuestTask,
  setQuestVerified,
} from "@/app/actions/db-campaigns";
import type { LearningCircuitData, Modul, Quest } from "@/lib/types";
import { getApiKey, getSelectedModel } from "@/components/ui/api-key-dialog";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Sparkles, Lock, ChevronDown, ChevronRight, ClipboardList, ExternalLink, Loader2 } from "lucide-react";
import { XpToast } from "@/components/ui/xp-toast";
import { ApiKeyDialog } from "@/components/ui/api-key-dialog";
import GlobalNavbar from "@/components/global-navbar";

function modulToQuest(m: Modul): Quest {
  const seen = new Set<string>()
  const learningLinks = m.todos.flatMap((t) => t.resources || []).filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
  return {
    id: m.id,
    title: m.title,
    description: "",
    tasks: m.todos.map((t) => ({ id: t.id, text: t.task, isCompleted: t.isDone })),
    isVerified: m.done,
    learningLinks,
  };
}

function mergeQuestStateToModuls(quests: Quest[], originalModuls: Modul[]): Modul[] {
  return originalModuls.map((modul) => {
    const quest = quests.find((q) => q.id === modul.id);
    if (!quest) return modul;
    return {
      ...modul,
      done: quest.isVerified,
      todos: modul.todos.map((todo) => {
        const task = quest.tasks.find((t) => t.id === todo.id);
        if (!task) return todo;
        return { ...todo, isDone: task.isCompleted };
      }),
    };
  });
}

const COLUMNS = [
  {
    key: "todo",
    title: "To Do",
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-600",
    countBg: "bg-slate-200",
    countText: "text-slate-500",
  },
  {
    key: "ongoing",
    title: "On Going",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-600",
    countBg: "bg-amber-200",
    countText: "text-amber-700",
  },
  {
    key: "done",
    title: "Done",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    countBg: "bg-emerald-200",
    countText: "text-emerald-700",
  },
] as const;

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaign_id as string;

  const [campaignData, setCampaignData] = useState<LearningCircuitData | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verifyingQuest, setVerifyingQuest] = useState<Quest | null>(null);
  const [proofType, setProofType] = useState<string>("github_repo");
  const [proofContent, setProofContent] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ isVerified: boolean; feedback: string; confidenceScore: number } | null>(null);
  const [questFeedback, setQuestFeedback] = useState<Record<string, { feedback: string; confidenceScore: number }>>({});
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      setLoading(true);

      const result = await getDatabaseCampaignById(campaignId);
      if (result.success && result.data) {
        setCampaignData(result.data);
        setQuests(result.data.moduls.map(modulToQuest));
      } else {
        setError(result.error || "Failed to load campaign.");
      }
      setLoading(false);
    };

    fetchCampaign();
  }, [campaignId]);

  const todoQuests = useMemo(
    () => quests.filter((q) => q.tasks.every((t) => !t.isCompleted)),
    [quests]
  );
  const ongoingQuests = useMemo(
    () => quests.filter((q) => q.tasks.some((t) => t.isCompleted) && !q.tasks.every((t) => t.isCompleted)),
    [quests]
  );
  const doneQuests = useMemo(
    () => quests.filter((q) => q.tasks.every((t) => t.isCompleted)),
    [quests]
  );

  const columnQuests: Record<string, Quest[]> = useMemo(
    () => ({ todo: todoQuests, ongoing: ongoingQuests, done: doneQuests }),
    [todoQuests, ongoingQuests, doneQuests]
  );

  const handleToggleTask = async (questId: string, taskId: string) => {
    if (!campaignData) return;

    const nextQuests = quests.map((q) =>
      q.id === questId
        ? {
            ...q,
            tasks: q.tasks.map((t) =>
              t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
            ),
          }
        : q
    );

    setQuests(nextQuests);
    setQuestFeedback((prev) => {
      const next = { ...prev };
      delete next[questId];
      return next;
    });

    const updatedModuls = mergeQuestStateToModuls(nextQuests, campaignData.moduls);
    setCampaignData({ ...campaignData, moduls: updatedModuls });
    const result = await toggleQuestTask(campaignId, questId, taskId);
    if (result.xpAwarded) setXpToast(result.xpAwarded);
  };

  const openVerification = (quest: Quest) => {
    setVerifyingQuest(quest);
    setProofType("github_repo");
    setProofContent("");
    setFeedback(null);
  };

  const resetVerification = () => {
    setVerifyingQuest(null);
    setProofType("github_repo");
    setProofContent("");
    setFeedback(null);
  };

  const handleVerifyAnswer = async () => {
    if (!verifyingQuest || !proofContent.trim()) return;

    const apiKey = getApiKey()
    if (!apiKey) {
      setVerifyingQuest(null)
      setShowApiKeyDialog(true)
      return
    }

    const selectedModel = getSelectedModel()
    setVerifying(true);
    setFeedback(null);

    const modul = campaignData?.moduls.find((m) => m.id === verifyingQuest.id);
    const tasks = modul?.todos.map((t) => t.task) || [];

    const result = await verifyModulProgress(
      verifyingQuest.title,
      proofType,
      proofContent,
      campaignData?.targetDescription || '',
      tasks,
      apiKey,
      selectedModel
    );

    if (result.success && result.isVerified) {
      setFeedback({
        isVerified: true,
        feedback: result.feedback || 'Proof accepted.',
        confidenceScore: result.confidenceScore || 100,
      });
      setQuestFeedback((prev) => {
        const next = { ...prev };
        delete next[verifyingQuest.id];
        return next;
      });
      const nextQuests = quests.map((q) =>
        q.id === verifyingQuest.id ? { ...q, isVerified: true } : q
      );
      setQuests(nextQuests);
      const updatedModuls = mergeQuestStateToModuls(nextQuests, campaignData!.moduls);
      setCampaignData((prev) => (prev ? { ...prev, moduls: updatedModuls } : prev));
      const dbResult = await setQuestVerified(campaignId, verifyingQuest.id);
      if (dbResult.xpAwarded) setXpToast(dbResult.xpAwarded);
    } else if (result.success && !result.isVerified) {
      setFeedback({
        isVerified: false,
        feedback: result.feedback || 'Proof rejected.',
        confidenceScore: result.confidenceScore || 0,
      });
      setQuestFeedback((prev) => ({
        ...prev,
        [verifyingQuest.id]: {
          feedback: result.feedback || 'Proof rejected.',
          confidenceScore: result.confidenceScore || 0,
        },
      }));
    } else {
      setFeedback({
        isVerified: false,
        feedback: result.error || 'Failed to verify proof.',
        confidenceScore: 0,
      });
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center font-mono text-sm">
        Loading campaign...
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <p>{error || "Campaign not found."}</p>
        <p className="text-xs max-w-md text-zinc-600">
          ID: <span className="text-amber-400 font-mono">{campaignId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <GlobalNavbar />
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="p-6 bg-white border-2 border-slate-200 rounded-xl">
        <h2 className="text-2xl font-bold text-slate-900">Circuit: {campaignData.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{campaignData.targetDescription}</p>
        <span className="inline-block mt-2 text-xs font-mono bg-emerald-50 text-emerald-700 border-2 border-emerald-200 px-3 py-1 rounded">
          Total estimated: {campaignData.totalEstimatedWeeks} {campaignData.totalEstimatedWeeks === 1 ? "week" : "weeks"}
        </span>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const items = columnQuests[col.key];
          return (
            <div
              key={col.key}
              className={`rounded-xl p-4 ${col.bg} border ${col.border}`}
            >
              <h3 className={`text-sm font-semibold ${col.text} mb-4 flex items-center gap-2`}>
                <ClipboardList className="w-4 h-4" />
                {col.title}
                <span
                  className={`ml-auto text-xs font-mono ${col.countBg} ${col.countText} px-2 py-0.5 rounded`}
                >
                  {items.length}
                </span>
              </h3>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((quest) => (
                    <motion.div
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -20, filter: "blur(4px)" }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                        mass: 0.8,
                      }}
                    >
                      <QuestCard
                        quest={quest}
                        column={col.key}
                        onToggleTask={handleToggleTask}
                        onVerify={openVerification}
                        questFeedback={questFeedback[quest.id] || null}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-zinc-600 text-center py-6"
                  >
                    No quests
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROOF OF WORK VERIFICATION DIALOG */}
      <Dialog
        open={verifyingQuest !== null}
        onOpenChange={(open) => {
          if (!open) resetVerification();
        }}
      >
        <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-xl w-full p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Submit Quest Proof of Work
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide tangible evidence of your work for &quot;{verifyingQuest?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Proof Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Proof Type</Label>
              <Select value={proofType} onValueChange={setProofType}>
                <SelectTrigger className="w-full border-2 border-slate-200 bg-white text-slate-900 text-xs rounded-xl">
                  <SelectValue placeholder="Select proof type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-slate-200 rounded-xl">
                  <SelectItem value="github_repo" className="text-xs">GitHub Repository URL</SelectItem>
                  <SelectItem value="live_app" className="text-xs">Live App / Production Link</SelectItem>
                  <SelectItem value="technical_snippet" className="text-xs">Technical Snippet (Console Logs / Code Blocks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Input Field */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                {proofType === 'technical_snippet' ? 'Paste your code or execution logs' : 'Paste your URL'}
              </Label>
              {proofType === 'technical_snippet' ? (
                <Textarea
                  value={proofContent}
                  onChange={(e) => setProofContent(e.target.value)}
                  placeholder="Paste terminal logs, code blocks, or execution output here..."
                  className="w-full h-28 p-3 border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs resize-none rounded-xl"
                />
              ) : (
                <Input
                  value={proofContent}
                  onChange={(e) => setProofContent(e.target.value)}
                  placeholder={proofType === 'github_repo' ? 'https://github.com/username/repo' : 'https://your-app.vercel.app'}
                  className="w-full p-3 border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 text-xs rounded-xl"
                />
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleVerifyAnswer}
                disabled={verifying || !proofContent.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 border-2 border-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
              >
                {verifying ? (
                  <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...</>
                ) : (
                  'Submit Proof for AI Audit'
                )}
              </Button>
            </div>

            {/* AI Feedback Result */}
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
                    {feedback.isVerified ? 'Proof Verified' : 'Proof Rejected'}
                  </span>
                  <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded ${
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
          </div>
        </DialogContent>
      </Dialog>

      {xpToast !== null && (
        <XpToast
          xp={xpToast}
          onDismiss={() => setXpToast(null)}
        />
      )}

      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  column,
  onToggleTask,
  onVerify,
  questFeedback,
}: {
  quest: Quest;
  column: string;
  onToggleTask: (questId: string, taskId: string) => void;
  onVerify: (quest: Quest) => void;
  questFeedback?: { feedback: string; confidenceScore: number } | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalTasks = quest.tasks.length;
  const completedTasks = quest.tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
      {/* Title row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-400" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 leading-snug">{quest.title}</h4>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {completedTasks} / {totalTasks} Tasks
          </p>
        </div>
      </button>

      {/* Learning Links */}
      {quest.learningLinks?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quest.learningLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border-2 border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              {link.platform}
            </a>
          ))}
        </div>
      )}

      {/* Tasks */}
      {expanded && (
        <ul className="mt-3 space-y-2">
          {quest.tasks.map((task) => {
            const checkboxId = `checkbox-${quest.id}-${task.id}`
            return (
              <li key={checkboxId} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <Checkbox
                  id={checkboxId}
                  checked={task.isCompleted}
                  onCheckedChange={() => onToggleTask(quest.id, task.id)}
                  className="mt-0.5 border-2 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <label
                  htmlFor={checkboxId}
                  className={`font-medium cursor-pointer select-none ${
                    task.isCompleted ? "line-through text-slate-400" : ""
                  }`}
                >
                  {task.text}
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {/* AI verification */}
      {quest.isVerified ? (
        <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          AI Verified
        </div>
      ) : column === "done" ? (
        <Button
          onClick={() => onVerify(quest)}
          variant="outline"
          className="mt-3 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 hover:text-emerald-800 text-xs font-semibold rounded-lg"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Verify via AI
        </Button>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Lock className="w-3 h-3" />
          Complete all tasks first
        </div>
      )}

      {/* Rejection feedback */}
      {questFeedback && !quest.isVerified && (
        <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-red-700 font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            AI Feedback
          </div>
          <p className="text-red-600 leading-relaxed">{questFeedback.feedback}</p>
          <p className="text-red-400 font-mono text-[10px]">
            {questFeedback.confidenceScore}% confidence
          </p>
        </div>
      )}
    </div>
  );
}
