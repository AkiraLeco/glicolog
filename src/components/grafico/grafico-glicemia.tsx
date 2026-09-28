"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { formatarHora } from "@/lib/dominio/datas";
import type { Classificacao, Faixas } from "@/lib/dominio/faixas";
import type { PontoGrafico } from "@/lib/dominio/periodos";
import { cn } from "@/lib/utils";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COR_PONTO: Record<Classificacao, string> = {
  hipo_grave: "var(--faixa-hipo-grave)",
  hipo: "var(--faixa-hipo)",
  alvo: "var(--faixa-alvo)",
  hiper: "var(--faixa-hiper)",
  hiper_grave: "var(--faixa-hiper-grave)",
};

const FUSO = "America/Sao_Paulo";
const formatarDiaCurto = (t: number) => format(new TZDate(t, FUSO), "dd/MM");
const formatarDiaSemana = (t: number) =>
  format(new TZDate(t, FUSO), "EEE dd/MM", { locale: ptBR });

/**
 * Ponto da medição. A forma também indica a faixa (não só a cor):
 * círculo = no alvo, triângulo para baixo = hipo, para cima = hiper;
 * as faixas graves são maiores. O anel na cor do fundo separa pontos próximos.
 */
function Ponto({
  cx,
  cy,
  payload,
  ativo = false,
}: {
  cx?: number;
  cy?: number;
  payload?: PontoGrafico;
  ativo?: boolean;
}) {
  if (cx == null || cy == null || !payload) return null;
  const { classificacao } = payload;
  const grave = classificacao === "hipo_grave" || classificacao === "hiper_grave";
  const r = (grave ? 6 : 4.5) + (ativo ? 2 : 0);
  const estilo = {
    fill: COR_PONTO[classificacao],
    stroke: "var(--background)",
    strokeWidth: 2,
  };

  if (classificacao === "alvo") return <circle cx={cx} cy={cy} r={r} style={estilo} />;

  const para = classificacao.startsWith("hipo") ? 1 : -1; // 1 = aponta para baixo
  // Triângulos um pouco maiores que o círculo, para terem o mesmo peso visual.
  const h = r * 2.3;
  const pontos = [
    [cx - r * 1.35, cy - (para * h) / 2],
    [cx + r * 1.35, cy - (para * h) / 2],
    [cx, cy + (para * h) / 2],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return <polygon points={pontos} strokeLinejoin="round" style={estilo} />;
}

function Dica({ active, payload, multiplosDias }: TooltipContentProps<number, string> & { multiplosDias: boolean }) {
  const ponto = payload?.[0]?.payload as PontoGrafico | undefined;
  if (!active || !ponto) return null;
  return (
    <div className="grid gap-1 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p>
        <strong className="text-base tabular-nums">{ponto.valor}</strong>{" "}
        <span className="text-muted-foreground">mg/dL</span>
      </p>
      <IndicadorFaixa classificacao={ponto.classificacao} />
      <p className="text-muted-foreground">
        {multiplosDias && `${formatarDiaSemana(ponto.t)} · `}
        {formatarHora(new Date(ponto.t))}
      </p>
    </div>
  );
}

export type GraficoGlicemiaProps = {
  pontos: PontoGrafico[];
  faixas: Faixas;
  /** Início e fim do eixo X (ms). */
  dominio: [number, number];
  /** Posições das marcações do eixo X (ms). */
  marcas: number[];
  /** Marcações em horas ("06:00") ou em dias ("21/09"). */
  formatoMarcas: "hora" | "dia";
  /** Versão compacta, sem eixo Y e grade (tela inicial). */
  compacto?: boolean;
  className?: string;
};

export function GraficoGlicemia({
  pontos,
  faixas,
  dominio,
  marcas,
  formatoMarcas,
  compacto = false,
  className,
}: GraficoGlicemiaProps) {
  const maiorValor = Math.max(0, ...pontos.map((p) => p.valor));
  // Teto do eixo: pelo menos 300, arredondado para cima em múltiplos de 50.
  const tetoY = Math.max(300, Math.ceil((maiorValor + 20) / 50) * 50);
  const marcasY = [];
  for (let v = 50; v <= tetoY; v += tetoY > 400 ? 100 : 50) marcasY.push(v);

  return (
    <div className={cn("w-full", compacto ? "h-32" : "h-64 md:h-80", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={pontos}
          margin={compacto ? { top: 8, right: 8, bottom: 0, left: 8 } : { top: 8, right: 12, bottom: 0, left: -12 }}
        >
          {!compacto && <CartesianGrid vertical={false} stroke="var(--border)" />}
          <ReferenceArea
            y1={faixas.hipo}
            y2={faixas.hiper}
            ifOverflow="hidden"
            style={{ fill: "var(--faixa-alvo)", fillOpacity: 0.1 }}
            stroke="none"
          />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={dominio}
            ticks={marcas}
            tickFormatter={(t: number) =>
              formatoMarcas === "hora" ? formatarHora(new Date(t)) : formatarDiaCurto(t)
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            hide={compacto}
            domain={[40, tetoY]}
            ticks={marcasY}
            allowDataOverflow
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            content={(props) => (
              <Dica {...(props as TooltipContentProps<number, string>)} multiplosDias={formatoMarcas === "dia"} />
            )}
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            dataKey="valor"
            type="linear"
            stroke="var(--muted-foreground)"
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={(props) => <Ponto key={props.index} {...props} />}
            activeDot={(props) => <Ponto key={props.index} {...props} ativo />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
