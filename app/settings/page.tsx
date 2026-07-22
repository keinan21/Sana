"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import GlobalNavbar from "@/components/global-navbar";
import { Button } from "@/components/ui/button";
import {
  getCalendarStatus,
  getCalendarAuthUrl,
  disconnectCalendar,
} from "@/app/actions/calendar-sync";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { useSoundSettings } from "@/lib/use-sound-effects";

function SoundSettingsContent() {
  const { settings, setEnabled, setVolume, setTheme } = useSoundSettings();
  const [testPlayed, setTestPlayed] = useState(false);

  const themes = [
    { value: "soft" as const, label: "Soft", description: "Gentle, rounded tones" },
    { value: "crisp" as const, label: "Crisp", description: "Sharp, precise sounds" },
    { value: "arcade" as const, label: "Arcade", description: "Retro 8-bit style" },
    { value: "glass" as const, label: "Glass", description: "Airy, resonant tones" },
  ];

  const playTestSound = () => {
    setTestPlayed(true);
    window.dispatchEvent(new CustomEvent("sana:play-sound", { detail: "success" }));
    setTimeout(() => setTestPlayed(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-charcoal">Enable sounds</p>
          <p className="text-xs text-pencil-gray">Play audio feedback for XP gains, achievements, and milestones</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!settings.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled ? "bg-eager-green" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-charcoal">Volume</p>
              <span className="text-xs font-mono text-pencil-gray">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-eager-green"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-charcoal">Sound theme</p>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setTheme(theme.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    settings.theme === theme.value
                      ? "border-eager-green bg-storybook-green"
                      : "border-faded-gray hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-medium text-charcoal">{theme.label}</p>
                  <p className="text-xs text-pencil-gray">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={playTestSound}
            className="inline-flex items-center gap-2 text-sm font-medium text-eager-green hover:text-[#4db802] transition-colors"
          >
            <Volume2 className="h-4 w-4" />
            {testPlayed ? "Played!" : "Test sound"}
          </button>
        </>
      )}
    </div>
  );
}

function SettingsContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const calendarParam = searchParams.get("calendar");

  const [calendarStatus, setCalendarStatus] = useState<{
    connected: boolean;
    syncedCampaignCount?: number;
  }>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (calendarParam === "connected") {
      setNotification("Google Calendar connected successfully!");
    } else if (calendarParam === "error") {
      setNotification("Failed to connect Google Calendar. Please try again.");
    }
  }, [calendarParam]);

  useEffect(() => {
    getCalendarStatus().then((status) => {
      setCalendarStatus(status);
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    const url = await getCalendarAuthUrl();
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const result = await disconnectCalendar();
    if (result.success) {
      setCalendarStatus({ connected: false });
      setNotification("Google Calendar disconnected.");
    }
    setDisconnecting(false);
  };

  return (
    <>
      <GlobalNavbar />
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <h1 className="font-feather text-3xl font-black tracking-[-0.02em] text-eager-green mb-8">
          Settings
        </h1>

        {notification && (
          <div
            className={`mb-6 rounded-xl border-2 px-4 py-3 text-sm font-medium ${
              notification.includes("successfully")
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {notification}
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        <section className="rounded-xl border-2 border-faded-gray bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-storybook-green">
              <Calendar className="size-5 text-eager-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal">
                Google Calendar
              </h2>
              <p className="text-sm text-pencil-gray">
                Sync your quests and deadlines to Google Calendar
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-pencil-gray">
              <Loader2 className="size-4 animate-spin" />
              Checking connection status...
            </div>
          ) : calendarStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="size-5 text-green-500" />
                <span className="font-medium">Connected</span>
              </div>
              {calendarStatus.syncedCampaignCount !== undefined && (
                <p className="text-sm text-pencil-gray">
                  {calendarStatus.syncedCampaignCount} campaign
                  {calendarStatus.syncedCampaignCount !== 1 ? "s" : ""} synced
                  to calendar
                </p>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-pencil-gray">
                <XCircle className="size-5 text-pencil-gray" />
                <span>Not connected</span>
              </div>
              <p className="text-sm text-pencil-gray">
                Connect your Google Calendar to sync quest schedules and
                deadlines automatically.
              </p>
              <Button variant="default" size="sm" onClick={handleConnect}>
                <ExternalLink className="size-4" />
                Connect Google Calendar
              </Button>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border-2 border-faded-gray bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-storybook-green">
              <Volume2 className="size-5 text-eager-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal">
                Sound Effects
              </h2>
              <p className="text-sm text-pencil-gray">
                Configure audio feedback for achievements and milestones
              </p>
            </div>
          </div>

          <SoundSettingsContent />
        </section>

        <section className="mt-6 rounded-xl border-2 border-faded-gray bg-white p-6">
          <h2 className="text-lg font-bold text-charcoal mb-4">Profile</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-pencil-gray">Name: </span>
              <span className="font-medium text-charcoal">
                {user?.fullName || "—"}
              </span>
            </div>
            <div>
              <span className="text-pencil-gray">Email: </span>
              <span className="font-medium text-charcoal">
                {user?.primaryEmailAddress?.emailAddress || "—"}
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
