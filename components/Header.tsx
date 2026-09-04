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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl flex items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="Logo EAC" width={30} height={30} className="rounded-lg" />
          <span className="hidden sm:block font-serif text-[15px] font-semibold text-ink">
            Meu Canto, Minha Fé
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-4 text-sm font-semibold">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1.5 rounded-md ${
                  active ? "text-eac" : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
