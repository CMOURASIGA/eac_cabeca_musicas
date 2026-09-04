"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin/musicas", label: "Músicas" },
  { href: "/admin/importar", label: "Importar TXT" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-3">
        <h1 className="font-serif text-xl font-semibold">Painel administrativo</h1>
        <p className="text-sm text-ink-soft">
          O Supabase ainda não está configurado neste ambiente (faltam
          <code className="mx-1 rounded bg-paper-alt px-1">NEXT_PUBLIC_SUPABASE_URL</code>
          e
          <code className="mx-1 rounded bg-paper-alt px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          ). Sem isso não há autenticação nem persistência real — veja
          <code className="mx-1 rounded bg-paper-alt px-1">docs/SUPABASE_SETUP.md</code>.
        </p>
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
      <aside className="w-44 shrink-0 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
              pathname.startsWith(item.href) ? "bg-eac text-white" : "text-ink-soft hover:bg-paper-alt"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="mt-4 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red hover:bg-paper-alt"
        >
          Sair
        </button>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
