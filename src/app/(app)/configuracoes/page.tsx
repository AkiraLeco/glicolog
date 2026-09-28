import { Info, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obterFaixas } from "@/lib/dados/consultas";
import { obterUsuario } from "@/lib/supabase/servidor";
import { sair } from "../../(auth)/acoes";
import { ExcluirConta } from "./excluir-conta";
import { FormularioFaixas } from "./formulario-faixas";

export const metadata: Metadata = { title: "Ajustes" };

export default async function PaginaAjustes() {
  const [faixas, usuario] = await Promise.all([obterFaixas(), obterUsuario()]);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Faixas de glicemia</h2>
          </CardTitle>
          <CardDescription>
            Definem quando um valor aparece como hipoglicemia, no alvo ou hiperglicemia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioFaixas faixas={faixas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Conta</h2>
          </CardTitle>
          <CardDescription>
            Conectado como <strong className="text-foreground">{usuario?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <form action={sair}>
            <Button type="submit" variant="outline">
              <LogOut aria-hidden />
              Sair
            </Button>
          </form>
          <ExcluirConta />
        </CardContent>
      </Card>

      <Link
        href="/sobre"
        className="flex items-center gap-2 justify-self-start rounded-md text-sm underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Info className="size-4" aria-hidden />
        Sobre o Glicolog
      </Link>
    </div>
  );
}
