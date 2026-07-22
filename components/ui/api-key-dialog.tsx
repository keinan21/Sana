"use client"

import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl mx-auto before:border-emerald-200 before:bg-white before:shadow-lg">
        <DrawerHeader className="pb-0">
          <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/60 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <DrawerTitle className="text-base font-bold text-emerald-800 leading-tight">
                API & Model Settings
              </DrawerTitle>
              <DrawerDescription className="text-xs text-emerald-600/70 mt-1 leading-relaxed">
                Set your Gemini API key and choose a model. Stored locally in your browser.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-4 pt-5 pb-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <Label htmlFor="api-key" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="AIza..."
                className="w-full border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 pr-10 text-sm"
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <Label htmlFor="model-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
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
                    <span className="font-medium text-sm">{opt.label}</span>
                    <span className="ml-2 text-slate-500 text-[11px]">{opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Flash/Lite models are recommended to reduce rate limits and cost.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Get a free Gemini API key
          </a>

          {saved && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Settings saved locally.
            </p>
          )}
        </div>

        <DrawerFooter className="pt-2">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleClear}
              disabled={!inputValue.trim() && !getApiKey()}
              className="flex-1 sm:flex-none text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              Clear
            </Button>
            <Button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm border-2 border-emerald-700 py-4 sm:py-2.5"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
