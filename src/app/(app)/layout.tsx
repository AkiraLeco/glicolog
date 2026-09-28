import { Droplet, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/navegacao/navegacao";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { obterUsuario } from "@/lib/supabase/servidor";
import { sair } from "../(auth)/acoes";

function Marca() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Droplet className="size-5 text-destructive" aria-hidden />
      Glicolog
    </Link>
  );
}

function BotaoSair({ className }: { className?: string }) {
  return (
    <form action={sair} className={className}>
      <Button type="submit" variant="ghost" className="w-full justify-start">
        <LogOut aria-hidden />
        Sair
      </Button>
    </form>
  );
}

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  // O proxy já barra quem não está logado; esta checagem é uma segunda camada.
  const usuario = await obterUsuario();
  if (!usuario) redirect("/entrar");

  return (
    <div className="flex flex-1">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-3 focus:ring-ring/50"
      >
        Pular para o conteúdo
      </a>

      {/* Barra lateral — telas médias e grandes */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-6 border-r px-3 py-4 md:flex">
        <div className="px-3">
          <Marca />
        </div>
        <NavegacaoLateral />
        <div className="mt-auto grid gap-1">
          <p className="truncate px-3 text-xs text-muted-foreground" title={usuario.email}>
            {usuario.email}
          </p>
          <BotaoSair />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho — celulares */}
        <header className="flex items-center justify-between border-b px-4 py-1 md:hidden">
          <Marca />
          <BotaoSair />
        </header>

        {/* pb extra no celular: espaço para a barra inferior e os botões de registro fixos */}
        <main
          id="conteudo"
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-40 md:px-8 md:py-8"
        >
          {children}
        </main>
      </div>

      <NavegacaoInferior />
      <Toaster position="top-center" />
    </div>
  );
}
