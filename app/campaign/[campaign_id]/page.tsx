"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { verifyLinkProgress, verifyEssay, verifyReflection, determineVerificationType, generateTaskResources } from "@/app/actions/generator";
import {
  getDatabaseCampaignById,
  updateDatabaseCampaignProgress,
  toggleQuestTask,
  setQuestVerified,
  addQuestToCampaign,
  addMultipleQuestsToCampaign,
  removeQuestFromCampaign,
  updateQuestInCampaign,
} from "@/app/actions/db-campaigns";
import type { LearningCircuitData, Modul, Quest } from "@/lib/types";
import { getApiKey, getSelectedModel } from "@/components/ui/api-key-dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Sparkles, Lock, ChevronDown, ChevronRight, ClipboardList, ExternalLink, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { XpToast } from "@/components/ui/xp-toast";
import { ApiKeyDialog } from "@/components/ui/api-key-dialog";
import { QuestVerificationDialog } from "@/components/quest-verification/QuestVerificationDialog";
import { AchievementUnlocked } from "@/components/ui/achievement-unlocked";
import { MilestoneToast } from "@/components/ui/milestone-toast";
import { ACHIEVEMENTS } from "@/lib/achievements";
import GlobalNavbar from "@/components/global-navbar";
import GridLoader from "@/components/ui/spinner-10";
import { AddQuestDialog } from "@/components/quest-management/AddQuestDialog";
import { GenerateQuestsDialog } from "@/components/quest-management/GenerateQuestsDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function modulToQuest(m: Modul): Quest {
  let learningLinks: import("@/lib/types").Resource[]
  if (m.resources && m.resources.length > 0) {
    learningLinks = m.resources
  } else {
    const seen = new Set<string>()
    learningLinks = m.todos.flatMap((t) => t.resources || []).filter((r) => {
      if (seen.has(r.url)) return false
      seen.add(r.url)
      return true
    })
  }
  return {
    id: m.id,
    title: m.title,
    description: m.description || "",
    idealDaysToComplete: m.idealDaysToComplete,
    createdAt: m.createdAt,
    tasks: m.todos.map((t) => ({ id: t.id, text: t.task, isCompleted: t.isDone })),
    isVerified: m.done,
    learningLinks,
    type: m.type || null,
    minReflectionLength: m.minReflectionLength,
    essayPrompt: m.essayPrompt,
    linkInstructions: m.linkInstructions,
    verificationAnswer: m.verificationAnswer,
    verificationResponse: m.verificationResponse,
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
    title: "Achieved",
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
  const [verificationResolving, setVerificationResolving] = useState(false);
  const [questFeedback, setQuestFeedback] = useState<Record<string, { feedback: string; confidenceScore: number }>>({});
  const [xpToast, setXpToast] = useState<{ xp: number; reason?: string; detail?: string } | null>(null);
  const [earnedAchievements, setEarnedAchievements] = useState<{ id: string; name: string; description?: string | null }[]>([]);
  const [milestoneToast, setMilestoneToast] = useState<{ percentage: number; levelName: string; nextLevelName: string } | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const pendingVerificationRef = useRef<Record<string, { answer: string; response: string }>>({});

  const [showAddQuestDialog, setShowAddQuestDialog] = useState(false);
  const [showGenerateQuestsDialog, setShowGenerateQuestsDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [confirmDeleteQuestId, setConfirmDeleteQuestId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    document.title = "Campaign | Sana"
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
    if (result.xpAwarded) {
      const taskText = quests.find((q) => q.id === questId)?.tasks.find((t) => t.id === taskId)?.text;
      setXpToast({ xp: result.xpAwarded, reason: "task completed", detail: taskText });
    }
    if (result.achievements?.length) {
      const defs = result.achievements.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean) as { id: string; name: string; description?: string | null }[];
      setEarnedAchievements((prev) => [...prev, ...defs]);
    }
    if (result.milestones?.length) {
      setMilestoneToast(result.milestones[0]);
    }
  };

  const openVerification = async (quest: Quest) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return
    }

    setVerificationResolving(true);

    const modul = campaignData?.moduls.find((m) => m.id === quest.id);
    const tasks = modul?.todos.map((t) => t.task) || [];

    const result = await determineVerificationType(
      quest.title,
      tasks,
      apiKey,
      getSelectedModel()
    );

    if (result.success && result.data) {
      const resolvedQuest: Quest = {
        ...quest,
        type: result.data.type,
        minReflectionLength: result.data.minReflectionLength,
        essayPrompt: result.data.essayPrompt,
        linkInstructions: result.data.linkInstructions,
      };
      setVerifyingQuest(resolvedQuest);
    } else {
      setQuestFeedback((prev) => ({
        ...prev,
        [quest.id]: { feedback: result.error || "Failed to determine verification type.", confidenceScore: 0 },
      }));
    }

    setVerificationResolving(false);
  };

  const handleQuestVerified = async (quest: Quest) => {
    const pending = pendingVerificationRef.current[quest.id];
    const verificationData = pending || undefined;
    delete pendingVerificationRef.current[quest.id];

    const nextQuests = quests.map((q) =>
      q.id === quest.id ? { ...q, isVerified: true } : q
    );
    setQuests(nextQuests);
    setQuestFeedback((prev) => {
      const next = { ...prev };
      delete next[quest.id];
      return next;
    });
    if (campaignData) {
      const updatedModuls = mergeQuestStateToModuls(nextQuests, campaignData.moduls);
      setCampaignData({ ...campaignData, moduls: updatedModuls });
    }
    setVerifyingQuest(null);
    const dbResult = await setQuestVerified(campaignId, quest.id, verificationData);
    if (dbResult.xpAwarded) setXpToast({ xp: dbResult.xpAwarded, reason: "quest verified", detail: quest.title });
    if (dbResult.achievements?.length) {
      const defs = dbResult.achievements.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean) as { id: string; name: string; description?: string | null }[];
      setEarnedAchievements((prev) => [...prev, ...defs]);
    }
    if (dbResult.milestones?.length) {
      setMilestoneToast(dbResult.milestones[0]);
    }
  };

  const handleVerifyReflection = async (quest: Quest, text: string) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return { success: false, error: "API key required" }
    }
    const selectedModel = getSelectedModel()
    const modul = campaignData?.moduls.find((m) => m.id === quest.id);
    const tasks = modul?.todos.map((t) => t.task) || [];
    const result = await verifyReflection(
      quest.title,
      text,
      campaignData?.targetDescription || '',
      tasks,
      apiKey,
      selectedModel
    );
    if (result.success && result.isVerified) {
      pendingVerificationRef.current[quest.id] = { answer: text, response: result.feedback || '' };
    }
    return result;
  };

  const handleVerifyLink = async (quest: Quest, url: string) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return { success: false, error: "API key required" }
    }
    const selectedModel = getSelectedModel()
    const modul = campaignData?.moduls.find((m) => m.id === quest.id);
    const tasks = modul?.todos.map((t) => t.task) || [];
    const result = await verifyLinkProgress(
      quest.title,
      'live_app',
      url,
      campaignData?.targetDescription || '',
      tasks,
      apiKey,
      selectedModel
    );
    if (result.success && result.isVerified) {
      pendingVerificationRef.current[quest.id] = { answer: url, response: result.feedback || '' };
    }
    return result;
  };

  const handleVerifyEssay = async (quest: Quest, essayText: string) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return { success: false, error: "API key required" }
    }
    const selectedModel = getSelectedModel()
    const modul = campaignData?.moduls.find((m) => m.id === quest.id);
    const tasks = modul?.todos.map((t) => t.task) || [];
    const result = await verifyEssay(
      quest.title,
      essayText,
      quest.essayPrompt || 'Explain your understanding of this topic',
      campaignData?.targetDescription || '',
      tasks,
      apiKey,
      selectedModel
    );
    if (result.success && result.isVerified) {
      pendingVerificationRef.current[quest.id] = { answer: essayText, response: result.feedback || '' };
    }
    return result;
  };

  const handleAddQuest = async (input: { title: string; description?: string; idealDaysToComplete?: number; tasks: { text: string }[]; resources?: { platform: string; title: string; url: string }[] }) => {
    const result = await addQuestToCampaign(campaignId, input);
    if (result.success && result.data) {
      const newQuest = modulToQuest(result.data);
      setQuests((prev) => [...prev, newQuest]);
      setCampaignData((prev) =>
        prev ? { ...prev, moduls: [...prev.moduls, result.data!] } : prev
      );
    } else {
      throw new Error(result.error || "Failed to add quest");
    }
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setShowAddQuestDialog(true);
  };

  const handleSaveEdit = async (input: { title: string; description?: string; idealDaysToComplete?: number; tasks: { text: string }[]; resources?: { platform: string; title: string; url: string }[] }) => {
    if (!editingQuest) return;
    const originalModul = campaignData?.moduls.find((m) => m.id === editingQuest.id);
    const existingTodos = originalModul?.todos || [];
    const todos = input.tasks.map((taskInput, i) => {
      const existing = existingTodos[i];
      return {
        id: existing?.id || crypto.randomUUID(),
        task: taskInput.text,
        isDone: existing?.isDone || false,
        resources: [],
      };
    });
    const result = await updateQuestInCampaign(campaignId, editingQuest.id, {
      title: input.title,
      description: input.description,
      idealDaysToComplete: input.idealDaysToComplete,
      todos,
      resources: input.resources,
    });
    if (result.success && result.data) {
      setQuests((prev) =>
        prev.map((q) => (q.id === editingQuest.id ? modulToQuest(result.data!) : q))
      );
      setCampaignData((prev) =>
        prev
          ? { ...prev, moduls: prev.moduls.map((m) => (m.id === editingQuest.id ? result.data! : m)) }
          : prev
      );
      setEditingQuest(null);
    } else {
      throw new Error(result.error || "Failed to update quest");
    }
  };

  const handleConfirmDeleteQuest = async () => {
    if (!confirmDeleteQuestId) return;
    setDeleteLoading(true);
    try {
      const result = await removeQuestFromCampaign(campaignId, confirmDeleteQuestId);
      if (result.success) {
        setQuests((prev) => prev.filter((q) => q.id !== confirmDeleteQuestId));
        setCampaignData((prev) =>
          prev
            ? { ...prev, moduls: prev.moduls.filter((m) => m.id !== confirmDeleteQuestId) }
            : prev
        );
      }
      setConfirmDeleteQuestId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddGeneratedQuests = async (moduls: Modul[]) => {
    const result = await addMultipleQuestsToCampaign(campaignId, moduls);
    if (result.success && result.data) {
      const newQuests = moduls.map(modulToQuest);
      setQuests((prev) => [...prev, ...newQuests]);
      setCampaignData((prev) =>
        prev ? { ...prev, moduls: [...prev.moduls, ...moduls] } : prev
      );
    } else {
      throw new Error(result.error || "Failed to add quests");
    }
  };

  const handleGenerateResources = async (questTitle: string): Promise<{ platform: string; title: string; url: string }[]> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return [];
    }
    const result = await generateTaskResources(
      questTitle,
      campaignData?.title || '',
      campaignData?.targetDescription || '',
      apiKey,
      getSelectedModel()
    );
    if (result.success && result.data) {
      return result.data;
    }
    return [];
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
      {verificationResolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center gap-4">
            <GridLoader size={56} color="#10b981" mode="stagger" speed="normal" rounded />
            <p className="text-sm font-medium text-slate-700">
              Determining verification type...
            </p>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl p-4 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="p-6 bg-white border-2 border-slate-200 rounded-xl">
        <h2 className="text-2xl font-bold text-slate-900">Circuit: {campaignData.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{campaignData.targetDescription}</p>
        <span className="inline-block mt-2 text-xs font-mono bg-emerald-50 text-emerald-700 border-2 border-emerald-200 px-3 py-1 rounded">
          Total estimated: {campaignData.totalEstimatedWeeks} {campaignData.totalEstimatedWeeks === 1 ? "week" : "weeks"}
        </span>

        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={() => { setEditingQuest(null); setShowAddQuestDialog(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 border-2 border-emerald-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Quest
          </Button>
          <Button
            onClick={() => { setShowGenerateQuestsDialog(true); }}
            variant="outline"
            className="text-slate-700 border-2 border-slate-200 hover:bg-slate-100 text-xs font-semibold px-3 py-2"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
            Generate Quests
          </Button>
        </div>
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
                        onEdit={handleEditQuest}
                        onDelete={(id) => setConfirmDeleteQuestId(id)}
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

        <QuestVerificationDialog
        quest={verifyingQuest}
        open={verifyingQuest !== null}
        onOpenChange={(open) => { if (!open) setVerifyingQuest(null); }}
        onVerifyReflection={handleVerifyReflection}
        onVerifyEssay={handleVerifyEssay}
        onVerifyLink={handleVerifyLink}
        onVerified={handleQuestVerified}
      />

      {xpToast !== null && (
        <XpToast
          xp={xpToast.xp}
          reason={xpToast.reason}
          detail={xpToast.detail}
          onDismiss={() => setXpToast(null)}
        />
      )}

      {earnedAchievements.length > 0 && (
        <AchievementUnlocked
          achievement={earnedAchievements[0]}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEarnedAchievements((prev) => prev.slice(1));
          }}
        />
      )}

      {milestoneToast && (
        <MilestoneToast
          percentage={milestoneToast.percentage}
          levelName={milestoneToast.levelName}
          nextLevelName={milestoneToast.nextLevelName}
          onDismiss={() => setMilestoneToast(null)}
        />
      )}

      <ApiKeyDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog} />

      <AddQuestDialog
        open={showAddQuestDialog}
        onOpenChange={(o) => { setShowAddQuestDialog(o); if (!o) setEditingQuest(null); }}
        onSave={editingQuest ? handleSaveEdit : handleAddQuest}
        initialQuest={editingQuest || undefined}
        initialResources={editingQuest ? campaignData?.moduls.find((m) => m.id === editingQuest.id)?.resources : undefined}
        onGenerateResources={handleGenerateResources}
      />

      <GenerateQuestsDialog
        open={showGenerateQuestsDialog}
        onOpenChange={setShowGenerateQuestsDialog}
        campaignTitle={campaignData.title}
        campaignDescription={campaignData.targetDescription}
        onAddQuests={handleAddGeneratedQuests}
        onOpenApiKeyDialog={() => setShowApiKeyDialog(true)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteQuestId !== null} onOpenChange={(o) => { if (!o) setConfirmDeleteQuestId(null); }}>
        <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-sm w-full p-6 rounded-xl">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Delete Quest?
          </DialogTitle>
          <p className="text-sm text-slate-600">
            This will permanently remove this quest and all its tasks. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteQuestId(null)}
              className="border-2 border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteQuest}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold border-2 border-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  column,
  onToggleTask,
  onVerify,
  onEdit,
  onDelete,
  questFeedback,
}: {
  quest: Quest;
  column: string;
  onToggleTask: (questId: string, taskId: string) => void;
  onVerify: (quest: Quest) => void;
  onEdit?: (quest: Quest) => void;
  onDelete?: (questId: string) => void;
  questFeedback?: { feedback: string; confidenceScore: number } | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const totalTasks = quest.tasks.length;
  const completedTasks = quest.tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
      {/* Title row */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-start gap-2 text-left flex-1 min-w-0"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-400" />
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{quest.title}</h4>
            {quest.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{quest.description}</p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {completedTasks} / {totalTasks} Tasks
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && !quest.isVerified && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(quest); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Edit quest"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && !quest.isVerified && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(quest.id); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete quest"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Time estimate indicator */}
      {quest.idealDaysToComplete > 0 && quest.createdAt && (() => {
        const now = Date.now();
        const created = new Date(quest.createdAt!).getTime();
        const elapsedDays = (now - created) / (1000 * 60 * 60 * 24);
        const ratio = Math.min(elapsedDays / quest.idealDaysToComplete, 1);
        const daysLeft = Math.ceil(quest.idealDaysToComplete - elapsedDays);
        const overdue = daysLeft < 0;

        let barColor: string;
        let textColor: string;
        let label: string;
        if (overdue) {
          barColor = "bg-red-500";
          textColor = "text-red-500";
          label = `${Math.abs(daysLeft)} days overdue`;
        } else if (ratio > 0.7) {
          barColor = "bg-amber-500";
          textColor = "text-amber-600";
          label = `${daysLeft} days left`;
        } else {
          barColor = "bg-emerald-500";
          textColor = "text-emerald-600";
          label = `${daysLeft} days left`;
        }

        return (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                {quest.idealDaysToComplete} days
              </span>
              <span className={`font-semibold ${textColor}`}>{label}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        );
      })()}

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
                  disabled={quest.isVerified}
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

      {/* Verification */}
      {quest.isVerified ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
          </div>
          {quest.verificationAnswer && quest.verificationResponse && (
            <div className="mt-2">
              <button
                onClick={() => setShowVerification(!showVerification)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showVerification ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                View Verification Details
              </button>
              {showVerification && (
                <div className="mt-2 space-y-2">
                  <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">Your Answer</p>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{quest.verificationAnswer}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider">AI Response</p>
                    <p className="text-emerald-600 leading-relaxed whitespace-pre-wrap">{quest.verificationResponse}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : column === "done" ? (
        <Button
          onClick={() => onVerify(quest)}
          variant="outline"
          className="mt-2 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 hover:text-emerald-800 text-xs font-semibold rounded-lg"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Verify Quest
        </Button>
      ) : (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
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