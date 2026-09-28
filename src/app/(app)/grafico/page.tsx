import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { GraficoGlicemia } from "@/components/grafico/grafico-glicemia";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { obterFaixas, obterGlicemiasEntre } from "@/lib/dados/consultas";
import { formatarHora } from "@/lib/dominio/datas";
import { ROTULO_CLASSIFICACAO } from "@/lib/dominio/faixas";
import {
  calcularIntervalo,
  lerPeriodo,
  marcasDoEixo,
  PERIODOS,
  pontosDoGrafico,
  resumirPeriodo,
  type Periodo,
  type PontoGrafico,
} from "@/lib/dominio/periodos";
import { cn } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Gráfico" };

const dataCurta = (t: number) => format(new TZDate(t, "America/Sao_Paulo"), "dd/MM");

function momento(ponto: PontoGrafico, multiplosDias: boolean) {
  const hora = formatarHora(new Date(ponto.t));
  return multiplosDias ? `${dataCurta(ponto.t)} às ${hora}` : `às ${hora}`;
}

export default async function PaginaGrafico({ searchParams }: PageProps<"/grafico">) {
  const parametros = await searchParams;
  const periodo = lerPeriodo(parametros.periodo);
  const fim = typeof parametros.fim === "string" ? parametros.fim : undefined;
  const intervalo = calcularIntervalo(periodo, fim);
  const multiplosDias = periodo !== "dia";

  const [faixas, glicemias] = await Promise.all([
    obterFaixas(),
    obterGlicemiasEntre(intervalo.inicio, intervalo.fim),
  ]);
  const pontos = pontosDoGrafico(glicemias, faixas);
  const resumo = resumirPeriodo(pontos);

  const href = (p: Periodo, f?: string | null) =>
    `/grafico?periodo=${p}${f ? `&fim=${f}` : ""}`;

  const textoResumo =
    resumo === null
      ? "Nenhuma glicemia registrada neste período."
      : `${resumo.quantidade} ${resumo.quantidade === 1 ? "medição" : "medições"}. ` +
        `Menor: ${resumo.menor.valor} mg/dL ${momento(resumo.menor, multiplosDias)} ` +
        `(${ROTULO_CLASSIFICACAO[resumo.menor.classificacao].toLowerCase()}). ` +
        `Maior: ${resumo.maior.valor} mg/dL ${momento(resumo.maior, multiplosDias)} ` +
        `(${ROTULO_CLASSIFICACAO[resumo.maior.classificacao].toLowerCase()}).`;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Gráfico</h1>

      {/* Filtros: período e navegação, numa linha acima do gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Período" className="inline-flex rounded-lg border p-0.5">
          {(Object.keys(PERIODOS) as Periodo[]).map((p) => (
            <Link
              key={p}
              href={href(p, fim)}
              aria-current={p === periodo ? "page" : undefined}
              className={cn(
                "flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground pointer-coarse:min-h-11 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                p === periodo && "bg-primary text-primary-foreground",
              )}
            >
              {PERIODOS[p].rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href={href(periodo, intervalo.anterior)}
            className={buttonVariants({ variant: "outline", size: "icon" })}
            aria-label="Período anterior"
          >
            <ChevronLeft aria-hidden />
          </Link>
          {intervalo.proximo ? (
            <Link
              href={href(periodo, intervalo.proximo)}
              className={buttonVariants({ variant: "outline", size: "icon" })}
              aria-label="Próximo período"
            >
              <ChevronRight aria-hidden />
            </Link>
          ) : (
            <span
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "opacity-40")}
              aria-disabled="true"
              role="link"
              aria-label="Próximo período (você já está no período atual)"
            >
              <ChevronRight aria-hidden />
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <figure className="grid gap-3" aria-labelledby="grafico-titulo">
            <div className="grid gap-1">
              <h2 id="grafico-titulo" className="font-medium first-letter:uppercase">
                Glicemia (mg/dL) · {intervalo.rotulo}
              </h2>
              <figcaption className="text-sm text-muted-foreground">{textoResumo}</figcaption>
            </div>
            {pontos.length > 0 && (
              <GraficoGlicemia
                pontos={pontos}
                faixas={faixas}
                dominio={[intervalo.inicio.getTime(), intervalo.fim.getTime()]}
                marcas={marcasDoEixo(intervalo)}
                formatoMarcas={multiplosDias ? "dia" : "hora"}
              />
            )}
          </figure>

          {pontos.length > 0 && (
            <>
              <Legenda alvo={`${faixas.hipo}–${faixas.hiper}`} />
              <details className="group rounded-lg border">
                <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium">
                  Ver valores em tabela
                </summary>
                <div className="max-h-96 overflow-auto border-t">
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      Glicemias de {intervalo.rotulo}
                    </caption>
                    <thead className="sticky top-0 bg-background">
                      <tr className="text-left text-muted-foreground">
                        <th scope="col" className="px-3 py-2 font-medium">
                          {multiplosDias ? "Data e hora" : "Hora"}
                        </th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">
                          mg/dL
                        </th>
                        <th scope="col" className="px-3 py-2 font-medium">
                          Faixa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pontos.map((p) => (
                        <tr key={p.t + "-" + p.valor}>
                          <td className="px-3 py-1.5 tabular-nums">
                            {multiplosDias && `${dataCurta(p.t)} `}
                            {formatarHora(new Date(p.t))}
                          </td>
                          <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                            {p.valor}
                          </td>
                          <td className="px-3 py-1.5">
                            <IndicadorFaixa classificacao={p.classificacao} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Explica a área sombreada e as formas dos pontos. */
function Legenda({ alvo }: { alvo: string }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded-sm bg-faixa-alvo/15" aria-hidden />
        Faixa-alvo ({alvo} mg/dL)
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 10 10" className="size-3" aria-hidden>
          <circle cx="5" cy="5" r="4" className="fill-faixa-alvo" />
        </svg>
        No alvo
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 10 10" className="size-3" aria-hidden>
          <polygon points="1,2 9,2 5,9" className="fill-faixa-hipo" />
        </svg>
        Abaixo do alvo
      </li>
      <li className="flex items-center gap-1.5">
        <svg viewBox="0 0 10 10" className="size-3" aria-hidden>
          <polygon points="1,8 9,8 5,1" className="fill-faixa-hiper" />
        </svg>
        Acima do alvo
      </li>
    </ul>
  );
}
