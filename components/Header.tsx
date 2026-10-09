"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DESKTOP_NAV = [
  { href: "/", label: "Início" },
  { href: "/livro-eac", label: "Livro EAC" },
  { href: "/missa", label: "Missa" },
  { href: "/selecao", label: "Seleção" },
];

const MOBILE_NAV = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/livro-eac", label: "Livro", icon: "▤" },
  { href: "/missa", label: "Missa", icon: "♪" },
  { href: "/selecao", label: "Seleção", icon: "♡" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const hideMobileBottom = pathname.startsWith("/admin") || pathname.startsWith("/musica/");

  return (
    <>
      <header className={(pathname.startsWith("/musica/") ? "hidden sm:block " : "") + "sticky top-0 z-30 w-full border-b border-border bg-white/95 backdrop-blur"}>
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-3 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="Logo EAC" width={34} height={34} className="rounded-xl" />
            <div className="hidden sm:block min-w-0">
              <div className="truncate font-serif text-[15px] font-bold text-ink">Meu Canto, Minha Fé</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">EAC</div>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-2 text-sm font-bold sm:flex">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "rounded-lg px-3 py-2 transition " +
                  (isActive(pathname, item.href) ? "bg-eac-soft text-eac" : "text-ink-soft hover:text-ink")
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto sm:hidden">
            <div className="text-right">
              <div className="text-xs font-black text-eac">EAC</div>
              <div className="text-[10px] text-ink-faint">música e missão</div>
            </div>
          </div>
        </div>
      </header>

      {!hideMobileBottom && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,27,51,0.08)] backdrop-blur sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {MOBILE_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 py-1">
                  <span className={"text-xl leading-none " + (active ? "text-eac" : "text-ink-faint")}>{item.icon}</span>
                  <span className={"text-[10px] font-black " + (active ? "text-eac" : "text-ink-faint")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
