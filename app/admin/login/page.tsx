"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(params.get("next") || "/admin/musicas");
      router.refresh();
    } catch (err: any) {
      setError("E-mail ou senha inválidos, ou sua conta ainda não foi criada pelo admin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-serif text-xl font-semibold mb-1">Entrar no painel</h1>
      <p className="text-sm text-ink-soft mb-6">
        Acesso restrito a Editor/Admin. Não há cadastro público — sua conta é criada pelo
        administrador.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none"
        />
        <input
          type="password"
          required
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none"
        />
        {error && <p className="text-xs text-red font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-eac py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm px-4 py-16 text-sm text-ink-soft">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
