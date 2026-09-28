import { History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListaRegistros } from "@/components/registro/lista-registros";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { obterFaixas, obterRegistrosDesde } from "@/lib/dados/consultas";
import { agruparPorDia, formatarDiaExtenso, inicioDoDia } from "@/lib/dominio/datas";

export const metadata: Metadata = { title: "Histórico" };

const PASSO_DIAS = 30;
const MAXIMO_DIAS = 365;

/** Lê ?dias= e limita a múltiplos de 30 entre 30 e 365. */
function diasPedidos(valor: string | string[] | undefined): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  if (!Number.isFinite(n) || n < PASSO_DIAS) return PASSO_DIAS;
  return Math.min(MAXIMO_DIAS, Math.ceil(n / PASSO_DIAS) * PASSO_DIAS);
}

export default async function PaginaHistorico({ searchParams }: PageProps<"/historico">) {
  const dias = diasPedidos((await searchParams).dias);
  const agora = new Date();
  // Início do dia de hoje menos (dias - 1) dias → "últimos N dias", incluindo hoje.
  const desde = inicioDoDia(new Date(agora.getTime() - (dias - 1) * 24 * 3600_000));

  const [faixas, registros] = await Promise.all([obterFaixas(), obterRegistrosDesde(desde)]);
  const grupos = agruparPorDia(registros);

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          Últimos {dias} dias · {registros.length}{" "}
          {registros.length === 1 ? "registro" : "registros"}
        </p>
      </div>

      {grupos.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-2 text-muted-foreground">
            <History className="size-5 shrink-0" aria-hidden />
            <p>
              Nenhum registro nos últimos {dias} dias. Use os botões da{" "}
              <Link href="/" className="text-foreground underline underline-offset-4">
                tela inicial
              </Link>{" "}
              para registrar glicemia e insulina.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {grupos.map((grupo) => (
            <Card key={grupo.dia.toISOString()} className="gap-2">
              <CardHeader>
                <CardTitle>
                  <h2 className="first-letter:uppercase">{formatarDiaExtenso(grupo.dia)}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListaRegistros registros={grupo.itens} faixas={faixas} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dias < MAXIMO_DIAS && (
        <Link
          href={`/historico?dias=${dias + PASSO_DIAS}`}
          scroll={false}
          className={buttonVariants({ variant: "outline", size: "lg", className: "justify-self-center" })}
        >
          Ver dias anteriores
        </Link>
      )}
    </div>
  );
}
