import Link from "next/link";
import { COR_TEXTO, IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { GraficoGlicemia } from "@/components/grafico/grafico-glicemia";
import { RegistrarGlicemia, RegistrarInsulina } from "@/components/registro/dialogos-registro";
import { ListaRegistros } from "@/components/registro/lista-registros";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  obterFaixas,
  obterGlicemiasEntre,
  obterRegistrosDesde,
  obterUltimaGlicemia,
  type RegistroGlicemia,
} from "@/lib/dados/consultas";
import { formatarDiaExtenso, formatarHora, inicioDoDia, tempoDecorrido } from "@/lib/dominio/datas";
import { classificar, type Faixas } from "@/lib/dominio/faixas";
import { marcasUltimas24h, pontosDoGrafico } from "@/lib/dominio/periodos";
import { cn } from "@/lib/utils";

export default async function Inicio() {
  const agora = new Date();
  const umDiaAtras = new Date(agora.getTime() - 24 * 3600_000);
  const [faixas, ultima, hoje, ultimas24h] = await Promise.all([
    obterFaixas(),
    obterUltimaGlicemia(),
    obterRegistrosDesde(inicioDoDia(agora)),
    obterGlicemiasEntre(umDiaAtras, agora),
  ]);
  const pontos24h = pontosDoGrafico(ultimas24h, faixas);

  return (
    <div className="grid gap-6">
      <h1 className="sr-only">Início</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-4">
          <UltimaGlicemia ultima={ultima} faixas={faixas} agora={agora} />

          {/* Celular: fixos acima da barra inferior. Telas maiores: logo abaixo do cartão. */}
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-2 gap-2 border-t bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <RegistrarGlicemia faixas={faixas} />
            <RegistrarInsulina />
          </div>

          {pontos24h.length > 0 && (
            <Card className="gap-2">
              <CardHeader className="flex flex-row items-baseline justify-between gap-2">
                <CardTitle>
                  <h2>Últimas 24 horas</h2>
                </CardTitle>
                <Link href="/grafico" className="text-sm underline underline-offset-4">
                  Ver gráfico
                </Link>
              </CardHeader>
              <CardContent>
                <figure aria-label={`Gráfico das últimas 24 horas: ${pontos24h.length} ${pontos24h.length === 1 ? "medição" : "medições"}`}>
                  <GraficoGlicemia
                    compacto
                    pontos={pontos24h}
                    faixas={faixas}
                    dominio={[umDiaAtras.getTime(), agora.getTime()]}
                    marcas={marcasUltimas24h(agora)}
                    formatoMarcas="hora"
                  />
                </figure>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Hoje</h2>
            </CardTitle>
            <p className="text-sm text-muted-foreground first-letter:uppercase">
              {formatarDiaExtenso(agora)}
            </p>
          </CardHeader>
          <CardContent>
            {hoje.length ? (
              <ListaRegistros registros={hoje} faixas={faixas} />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum registro hoje ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UltimaGlicemia({
  ultima,
  faixas,
  agora,
}: {
  ultima: RegistroGlicemia | null;
  faixas: Faixas;
  agora: Date;
}) {
  if (!ultima) {
    return (
      <Card>
        <CardContent className="grid gap-1 py-2">
          <h2 className="text-sm font-medium text-muted-foreground">Última glicemia</h2>
          <p className="text-lg">Nenhuma glicemia registrada ainda.</p>
          <p className="text-sm text-muted-foreground">
            Use o botão <strong>Glicemia</strong> para fazer o primeiro registro.
          </p>
        </CardContent>
      </Card>
    );
  }

  const classificacao = classificar(ultima.valor, faixas);
  return (
    <Card>
      <CardContent className="grid gap-2 py-2">
        <h2 className="text-sm font-medium text-muted-foreground">Última glicemia</h2>
        <p className={cn("flex items-baseline gap-2", COR_TEXTO[classificacao])}>
          <span className="text-6xl font-semibold tracking-tight tabular-nums">{ultima.valor}</span>
          <span className="text-lg">mg/dL</span>
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <IndicadorFaixa classificacao={classificacao} className="text-sm" />
          <span>
            <time dateTime={ultima.em.toISOString()}>{tempoDecorrido(ultima.em, agora)}</time>
            {" · "}
            {formatarHora(ultima.em)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
