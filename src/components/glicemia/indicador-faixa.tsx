import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROTULO_CLASSIFICACAO, type Classificacao } from "@/lib/dominio/faixas";

/** Classes de cor de texto por classificação (reutilizadas em listas e no gráfico). */
export const COR_TEXTO: Record<Classificacao, string> = {
  hipo_grave: "text-faixa-hipo-grave",
  hipo: "text-faixa-hipo",
  alvo: "text-faixa-alvo",
  hiper: "text-faixa-hiper",
  hiper_grave: "text-faixa-hiper-grave",
};

const COR_FUNDO: Record<Classificacao, string> = {
  hipo_grave: "bg-faixa-hipo-grave/10 border-faixa-hipo-grave/30",
  hipo: "bg-faixa-hipo/10 border-faixa-hipo/30",
  alvo: "bg-faixa-alvo/10 border-faixa-alvo/30",
  hiper: "bg-faixa-hiper/10 border-faixa-hiper/30",
  hiper_grave: "bg-faixa-hiper-grave/10 border-faixa-hiper-grave/30",
};

const ICONE: Record<Classificacao, typeof Check> = {
  hipo_grave: ChevronsDown,
  hipo: ChevronDown,
  alvo: Check,
  hiper: ChevronUp,
  hiper_grave: ChevronsUp,
};

/**
 * Selo com a classificação da glicemia: cor + ícone + texto.
 * Nunca depende só da cor (PROJETO.md, seção 5.1).
 */
export function IndicadorFaixa({
  classificacao,
  compacto = false,
  className,
}: {
  classificacao: Classificacao;
  /** Só ícone, com o texto disponível para leitores de tela. */
  compacto?: boolean;
  className?: string;
}) {
  const Icone = ICONE[classificacao];
  const rotulo = ROTULO_CLASSIFICACAO[classificacao];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        COR_TEXTO[classificacao],
        COR_FUNDO[classificacao],
        compacto && "px-1",
        className,
      )}
      title={compacto ? rotulo : undefined}
    >
      <Icone className="size-3.5" aria-hidden />
      {compacto ? <span className="sr-only">{rotulo}</span> : rotulo}
    </span>
  );
}
