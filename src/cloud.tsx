import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSession, useUser } from "@clerk/clerk-react";
import { SUPABASE_ANON_KEY, SUPABASE_URL, cloudConfigured } from "./config";
import { normalizeState, useAppState, useDispatch } from "./store";
import type { AppState } from "./types";

async function fetchCloudState(db: SupabaseClient): Promise<AppState | null> {
  // RLS limits the query to the signed-in user's row
  const { data, error } = await db.from("app_state").select("state").maybeSingle();
  if (error) throw error;
  return (data?.state as AppState) ?? null;
}

async function pushCloudState(db: SupabaseClient, userId: string, state: AppState): Promise<void> {
  const { error } = await db
    .from("app_state")
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

type SyncStatus = "loading" | "synced" | "saving" | "error";

const SAVE_DEBOUNCE_MS = 1000;
const RETRY_MS = 5000;

/**
 * Keeps the signed-in user's state mirrored to Supabase.
 * On mount the cloud copy wins if it exists; otherwise the local state is
 * uploaded (first sign-in adopts whatever was in localStorage).
 */
export function CloudSync() {
  const { session } = useSession();
  const { user } = useUser();
  const state = useAppState();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<SyncStatus>("loading");

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const stateRef = useRef(state);
  stateRef.current = state;

  const userId = user?.id ?? null;

  const db = useMemo(() => {
    if (!cloudConfigured || !userId) return null;
    return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      accessToken: async () => (await sessionRef.current?.getToken()) ?? null,
    });
  }, [userId]);

  const loadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback(async () => {
    if (!db || !userId) return;
    setStatus("saving");
    try {
      await pushCloudState(db, userId, stateRef.current);
      setStatus("synced");
    } catch {
      setStatus("error");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(save, RETRY_MS);
    }
  }, [db, userId]);

  // initial load: pull the cloud copy, or seed it from local state
  useEffect(() => {
    if (!db || !userId) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    async function loadOnce() {
      try {
        const remote = await fetchCloudState(db!);
        if (cancelled) return;
        if (remote) {
          skipNextSaveRef.current = true;
          dispatch({ type: "importState", state: normalizeState(remote) });
          loadedRef.current = true;
          setStatus("synced");
        } else {
          loadedRef.current = true;
          await save();
        }
      } catch {
        // never push local state before we know whether a cloud copy exists
        if (!cancelled) {
          setStatus("error");
          retryTimer = setTimeout(loadOnce, RETRY_MS);
        }
      }
    }
    loadOnce();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [db, userId, dispatch, save]);

  // debounced save on every change after the initial load
  useEffect(() => {
    if (!loadedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    setStatus("saving");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [state, save]);

  if (status === "synced") return null;
  return (
    <div className={`sync-badge ${status === "error" ? "error" : ""}`}>
      {status === "loading" && "☁️ Loading your data…"}
      {status === "saving" && "☁️ Saving…"}
      {status === "error" && "⚠️ Sync failed — retrying…"}
    </div>
  );
}
