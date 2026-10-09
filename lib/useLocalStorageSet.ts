"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook simples para persistir um conjunto de ids no localStorage do
 * visitante (favoritos, seleção temporária). Sem login: tudo fica no
 * navegador, conforme a especificação ("sem login público obrigatório,
 * persistir localmente favoritos... e última música").
 */
export function useLocalStorageSet(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      setIds(raw ? JSON.parse(raw) : []);
    } catch {
      setIds([]);
    }
    setReady(true);
  }, [key]);

  const persist = useCallback(
    (next: string[]) => {
      setIds(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // localStorage indisponível (modo privado, etc.) — segue só em memória.
      }
    },
    [key]
  );

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    },
    [ids, persist]
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, ready, toggle, has, setIds: persist };
}
