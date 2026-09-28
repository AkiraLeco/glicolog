/**
 * Faixas de glicemia (mg/dL). Ver PROJETO.md, seção 5.1.
 *
 *   valor < hipoGrave          → hipoglicemia grave
 *   valor < hipo               → hipoglicemia
 *   valor <= hiper             → no alvo
 *   valor <= hiperGrave        → hiperglicemia
 *   acima                      → hiperglicemia grave
 */
export type Faixas = {
  hipoGrave: number;
  hipo: number;
  hiper: number;
  hiperGrave: number;
};

export const FAIXAS_PADRAO: Faixas = { hipoGrave: 54, hipo: 70, hiper: 180, hiperGrave: 250 };

export type Classificacao = "hipo_grave" | "hipo" | "alvo" | "hiper" | "hiper_grave";

export const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  hipo_grave: "Hipoglicemia grave",
  hipo: "Hipoglicemia",
  alvo: "No alvo",
  hiper: "Hiperglicemia",
  hiper_grave: "Hiperglicemia grave",
};

export function classificar(valorMgdl: number, faixas: Faixas = FAIXAS_PADRAO): Classificacao {
  if (valorMgdl < faixas.hipoGrave) return "hipo_grave";
  if (valorMgdl < faixas.hipo) return "hipo";
  if (valorMgdl <= faixas.hiper) return "alvo";
  if (valorMgdl <= faixas.hiperGrave) return "hiper";
  return "hiper_grave";
}

/** Converte a linha da tabela `configuracao` para Faixas (ou usa o padrão). */
export function faixasDaConfiguracao(
  config:
    | {
        limite_hipo_grave: number;
        limite_hipo: number;
        limite_hiper: number;
        limite_hiper_grave: number;
      }
    | null
    | undefined,
): Faixas {
  if (!config) return FAIXAS_PADRAO;
  return {
    hipoGrave: config.limite_hipo_grave,
    hipo: config.limite_hipo,
    hiper: config.limite_hiper,
    hiperGrave: config.limite_hiper_grave,
  };
}
