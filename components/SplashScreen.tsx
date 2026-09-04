"use client";

import { useEffect, useState } from "react";

const SHOWN_KEY = "eac:splash-shown";

/**
 * Tela de abertura do app com o brasão oficial — aparece uma vez por sessão
 * do navegador (sessionStorage), com fade-out curto. Puramente decorativo:
 * nunca bloqueia a navegação além do tempo definido.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SHOWN_KEY) === "1";
    } catch {
      // sessionStorage indisponível — mostra a abertura mesmo assim, sem crashar.
    }
    if (alreadyShown) return;

    setVisible(true);
    const fadeTimer = setTimeout(() => setFading(true), 1100);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        // ok não persistir — só volta a aparecer em navegações futuras
      }
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => setFading(true)}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 transition-opacity duration-500 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(160deg, #0F1B33 0%, #060B18 100%)" }}
      aria-hidden="true"
    >
      <img
        src="/logo.png"
        alt=""
        width={112}
        height={112}
        className="h-28 w-28 rounded-[22%] shadow-[0_20px_60px_rgba(0,0,0,0.45)] animate-[eac-splash-in_0.7s_ease-out] motion-reduce:animate-none"
      />
      <div className="text-center animate-[eac-splash-in_0.7s_ease-out_0.15s_backwards] motion-reduce:animate-none">
        <div className="font-serif text-lg font-semibold text-gold">Meu Canto, Minha Fé</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/55 mt-1">Livro de Músicas EAC</div>
      </div>
    </div>
  );
}
