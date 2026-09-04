import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/**
 * Cliente para Server Components / Route Handlers. Usa os cookies da
 * requisição para saber se há uma sessão de editor/admin autenticada — a
 * leitura pública (visitante sem login) também passa por aqui, só que sem
 * sessão, e a RLS do banco filtra automaticamente para status = PUBLISHED.
 */
export function createServerSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // chamado a partir de um Server Component sem permissão de escrita
          // de cookie — inofensivo se o middleware já cuida do refresh.
        }
      },
    },
  });
}
