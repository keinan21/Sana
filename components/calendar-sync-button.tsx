"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { syncCampaign, getCalendarStatus, getCalendarAuthUrl } from "@/app/actions/calendar-sync";

interface CalendarSyncButtonProps {
  campaignId: string;
}

type SyncState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "synced"; created: number; updated: number }
  | { status: "error"; message: string };

export function CalendarSyncButton({ campaignId }: CalendarSyncButtonProps) {
  const [state, setState] = useState<SyncState>({ status: "loading" });

  useEffect(() => {
    getCalendarStatus().then((status) => {
      setState(
        status.connected ? { status: "idle" } : { status: "not_connected" }
      );
    });
  }, []);

  const handleClick = async () => {
    if (state.status === "not_connected") {
      const url = await getCalendarAuthUrl();
      window.location.href = url;
      return;
    }

    setState({ status: "syncing" });
    const result = await syncCampaign(campaignId);
    if (result.success) {
      setState({
        status: "synced",
        created: result.created ?? 0,
        updated: result.updated ?? 0,
      });
      setTimeout(() => setState({ status: "idle" }), 4000);
    } else {
      setState({ status: "error", message: result.error ?? "Sync failed" });
      setTimeout(() => setState({ status: "idle" }), 5000);
    }
  };

  const isDisabled = state.status === "syncing" || state.status === "loading";

  const buttonContent = () => {
    switch (state.status) {
      case "loading":
        return (
          <>
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </>
        );
      case "not_connected":
        return (
          <>
            <Calendar className="size-4" />
            Connect Google Calendar
          </>
        );
      case "idle":
        return (
          <>
            <Calendar className="size-4" />
            Sync to Calendar
          </>
        );
      case "syncing":
        return (
          <>
            <Loader2 className="size-4 animate-spin" />
            Syncing...
          </>
        );
      case "synced":
        return (
          <>
            <CheckCircle2 className="size-4 text-eager-green" />
            Synced! ({state.created} created, {state.updated} updated)
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="size-4 text-[#ff4b4b]" />
            {state.message}
          </>
        );
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={
        `w-full sm:w-auto ${
        state.status === "synced"
          ? "border-eager-green text-eager-green bg-storybook-green"
          : state.status === "error"
          ? "border-[#ff4b4b] text-[#ff4b4b] bg-[#ff4b4b]/10"
          : ""
        }`
      }
    >
      {buttonContent()}
    </Button>
  );
}
