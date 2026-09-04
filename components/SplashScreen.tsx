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
    const fadeTimer = setTimeout(() => setFading(true), 2400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        // ok não persistir — só volta a aparecer em navegações futuras
      }
    }, 3000);

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
        width={208}
        height={208}
        className="h-52 w-52 max-w-[62vw] max-h-[62vw] rounded-[18%] shadow-[0_24px_70px_rgba(0,0,0,0.5)] animate-[eac-splash-in_1s_ease-out] motion-reduce:animate-none"
      />
      <div className="text-center animate-[eac-splash-in_1s_ease-out_0.2s_backwards] motion-reduce:animate-none">
        <div className="font-serif text-xl font-semibold text-gold">Meu Canto, Minha Fé</div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/55 mt-1.5">Livro de Músicas EAC</div>
      </div>
    </div>
  );
}
