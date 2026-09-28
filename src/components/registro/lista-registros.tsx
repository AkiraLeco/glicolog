import { Droplet, Syringe } from "lucide-react";
import { COR_TEXTO, IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import type { Registro } from "@/lib/dados/consultas";
import { formatarHora } from "@/lib/dominio/datas";
import { classificar, type Faixas } from "@/lib/dominio/faixas";
import { formatarUnidades } from "@/lib/dominio/validacao";
import { cn } from "@/lib/utils";

/** Lista de glicemias e insulinas com hora, valor e classificação. */
export function ListaRegistros({ registros, faixas }: { registros: Registro[]; faixas: Faixas }) {
  return (
    <ul className="divide-y">
      {registros.map((registro) => (
        <li key={`${registro.tipo}-${registro.id}`} className="flex items-center gap-3 py-2.5">
          <time
            dateTime={registro.em.toISOString()}
            className="w-12 shrink-0 text-sm text-muted-foreground tabular-nums"
          >
            {formatarHora(registro.em)}
          </time>
          {registro.tipo === "glicemia" ? (
            <ItemGlicemia valor={registro.valor} faixas={faixas} />
          ) : (
            <ItemInsulina tipo={registro.tipoInsulina} unidades={registro.unidades} />
          )}
        </li>
      ))}
    </ul>
  );
}

function ItemGlicemia({ valor, faixas }: { valor: number; faixas: Faixas }) {
  const classificacao = classificar(valor, faixas);
  return (
    <>
      <Droplet className="size-4 shrink-0 text-muted-foreground" aria-label="Glicemia" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("font-semibold tabular-nums", COR_TEXTO[classificacao])}>
          {valor} <span className="text-xs font-normal">mg/dL</span>
        </span>
        <IndicadorFaixa classificacao={classificacao} />
      </span>
    </>
  );
}

function ItemInsulina({ tipo, unidades }: { tipo: "basal" | "bolus"; unidades: number }) {
  return (
    <>
      <Syringe className="size-4 shrink-0 text-muted-foreground" aria-label="Insulina" />
      <span className="flex-1">
        <span className="font-semibold tabular-nums">{formatarUnidades(unidades)} U</span>{" "}
        <span className="text-sm text-muted-foreground">
          {tipo === "basal" ? "basal" : "bolus"}
        </span>
      </span>
    </>
  );
}
