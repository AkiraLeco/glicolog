"use client";

import { ChartLine, FileUp, History, House, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", rotulo: "Início", icone: House },
  { href: "/historico", rotulo: "Histórico", icone: History },
  { href: "/grafico", rotulo: "Gráfico", icone: ChartLine },
  { href: "/importar", rotulo: "Importar", icone: FileUp },
  { href: "/configuracoes", rotulo: "Ajustes", icone: Settings },
] as const;

function useAtivo() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/** Lista vertical para a barra lateral (telas médias e grandes). */
export function NavegacaoLateral() {
  const ativo = useAtivo();
  return (
    <nav aria-label="Principal">
      <ul className="grid gap-1">
        {ITENS.map(({ href, rotulo, icone: Icone }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={ativo(href) ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                ativo(href) && "bg-muted text-foreground",
              )}
            >
              <Icone className="size-4" aria-hidden />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra fixa no rodapé (celulares). */
export function NavegacaoInferior() {
  const ativo = useAtivo();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITENS.map(({ href, rotulo, icone: Icone }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={ativo(href) ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                ativo(href) && "text-foreground",
              )}
            >
              <Icone
                className={cn("size-5", ativo(href) && "stroke-[2.5]")}
                aria-hidden
              />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
