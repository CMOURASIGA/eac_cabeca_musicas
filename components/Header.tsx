"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/livro-eac", label: "Livro EAC" },
  { href: "/missa", label: "Missa" },
  { href: "/selecao", label: "Seleção" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center gap-2 px-3 sm:px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="Logo EAC" width={30} height={30} className="rounded-lg" />
          <span className="hidden sm:block font-serif text-[15px] font-semibold text-ink">
            Meu Canto, Minha Fé
          </span>
        </Link>
        <nav className="ml-auto flex min-w-0 items-center justify-end gap-0 sm:gap-4 text-[12px] min-[370px]:text-[13px] sm:text-sm font-semibold">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-1.5 min-[370px]:px-2 py-1.5 rounded-md ${
                  active ? "text-eac" : "text-ink-soft hover:text-ink"
                }`}
              >
                <span className={item.href === "/selecao" ? "hidden sm:inline" : ""}>
                  {item.href === "/livro-eac" ? <><span className="sm:hidden">Livro</span><span className="hidden sm:inline">Livro EAC</span></> : item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
