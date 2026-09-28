import { Droplet, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { obterUsuario } from "@/lib/supabase/servidor";
import { sair } from "../(auth)/acoes";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  // O proxy já barra quem não está logado; esta checagem é uma segunda camada.
  const usuario = await obterUsuario();
  if (!usuario) redirect("/entrar");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <Droplet className="size-5 text-destructive" aria-hidden />
            Glicolog
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {usuario.email}
            </span>
            <form action={sair}>
              <Button type="submit" variant="ghost">
                <LogOut aria-hidden />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
