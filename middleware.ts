import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./lib/supabase/env";

/**
 * Protege /admin/*: sem sessão válida, redireciona para /admin/login.
 * A checagem de PAPEL (editor/admin, e não só "está logado") é feita pela
 * RLS no banco em cada leitura/escrita — aqui só garantimos que ninguém
 * sem login nenhum acesse as telas do painel.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const isAdminRoute =
    request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login";

  if (!isSupabaseConfigured) {
    // Sem Supabase configurado ainda: deixa passar (modo demonstração),
    // mas o próprio /admin exibe um aviso — não há dado sensível em risco.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
