"use client";

import { useCallback, useEffect, useState } from "react";

export interface MassRepertoire {
  id: string;
  name: string;
  eventDate: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

const DRAFT_KEY = "eac:mass-repertoire-draft";
const LIST_KEY = "eac:mass-repertoires";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useMassRepertoireDraft() {
  const [songIds, setSongIdsState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSongIdsState(readJson<string[]>(DRAFT_KEY, []));
    setReady(true);
  }, []);

  const setSongIds = useCallback((ids: string[]) => {
    setSongIdsState(ids);
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(ids));
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setSongIdsState((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => setSongIds([]), [setSongIds]);

  return { songIds, setSongIds, toggle, clear, ready, has: (id: string) => songIds.includes(id) };
}

export function loadMassRepertoires(): MassRepertoire[] {
  return readJson<MassRepertoire[]>(LIST_KEY, []);
}

export function saveMassRepertoire(input: Omit<MassRepertoire, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = new Date().toISOString();
  const current = loadMassRepertoires();
  const existing = input.id ? current.find((r) => r.id === input.id) : undefined;
  const item: MassRepertoire = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name,
    eventDate: input.eventDate,
    songIds: input.songIds,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = [item, ...current.filter((r) => r.id !== item.id)];
  window.localStorage.setItem(LIST_KEY, JSON.stringify(next));
  return item;
}

export function deleteMassRepertoire(id: string) {
  const next = loadMassRepertoires().filter((r) => r.id !== id);
  window.localStorage.setItem(LIST_KEY, JSON.stringify(next));
}
