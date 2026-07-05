"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KeyRound, Eye, EyeOff, ExternalLink, Sparkles } from "lucide-react"

const API_KEY_STORAGE = "user_ai_api_key"
const MODEL_STORAGE = "user_selected_model"

export const MODEL_OPTIONS = [
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", description: "Recommended for balanced performance" },
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", description: "Highly recommended to bypass strict rate limits" },
  { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro", description: "For complex processing" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast & efficient" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Lightweight & fastest" },
] as const

export type ModelId = (typeof MODEL_OPTIONS)[number]["value"]

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(API_KEY_STORAGE)
}

export function getSelectedModel(): ModelId {
  if (typeof window === "undefined") return "gemini-3.5-flash"
  return (localStorage.getItem(MODEL_STORAGE) as ModelId) || "gemini-3.5-flash"
}

export function useApiKey(): string | null {
  const [key, setKey] = useState<string | null>(null)
  useEffect(() => {
    setKey(getApiKey())
  }, [])
  return key
}

export function useSelectedModel(): ModelId {
  const [model, setModel] = useState<ModelId>("gemini-3.5-flash")
  useEffect(() => {
    setModel(getSelectedModel())
  }, [])
  return model
}

export function ApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [inputValue, setInputValue] = useState("")
  const [selectedModel, setSelectedModel] = useState<ModelId>("gemini-3.5-flash")
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setInputValue(getApiKey() ?? "")
      setSelectedModel(getSelectedModel())
      setSaved(false)
    }
  }, [open])

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (trimmed) {
      localStorage.setItem(API_KEY_STORAGE, trimmed)
    } else {
      localStorage.removeItem(API_KEY_STORAGE)
    }
    localStorage.setItem(MODEL_STORAGE, selectedModel)
    setSaved(true)
    setTimeout(() => onOpenChange(false), 800)
  }

  const handleClear = () => {
    localStorage.removeItem(API_KEY_STORAGE)
    localStorage.removeItem(MODEL_STORAGE)
    setInputValue("")
    setSelectedModel("gemini-3.5-flash")
    setSaved(true)
    setTimeout(() => onOpenChange(false), 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-slate-200 text-slate-900 max-w-md w-full p-6 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-emerald-700 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            API & Model Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Set your Gemini API key and choose a model. Your settings are stored in your browser's localStorage and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-xs font-medium text-slate-700">
              Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="AIza..."
                className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 pr-10 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select" className="text-xs font-medium text-slate-700">
              Gemini Model
            </Label>
            <Select value={selectedModel} onValueChange={(v: ModelId) => setSelectedModel(v)}>
              <SelectTrigger
                id="model-select"
                className="w-full border-2 border-slate-200 bg-white text-slate-900 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="border-2 border-slate-200 bg-white">
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-slate-900 focus:bg-slate-100">
                    <span className="font-medium">{opt.label}</span>
                    <span className="ml-2 text-slate-500 text-[10px]">{opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Flash/Lite models are recommended to reduce rate limits and cost.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 underline underline-offset-2"
          >
            <ExternalLink className="h-3 w-3" />
            Get a free Gemini API key
          </a>

          {saved && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Settings saved locally.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!inputValue.trim() && !getApiKey()}
            className="text-slate-500 hover:text-slate-700 text-xs"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border-2 border-emerald-700"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
