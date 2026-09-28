import { z } from "zod";
import { deDatetimeLocal } from "./datas";

/** Limites aceitos pelos glicosímetros. Ver PROJETO.md, seção 4.3. */
export const GLICEMIA_MIN = 20;
export const GLICEMIA_MAX = 600;

/** Acima disso, o app pede confirmação explícita da dose. */
export const INSULINA_DOSE_ALTA = 100;
/** Trava de sanidade (igual à do banco). */
export const INSULINA_MAX = 300;

/** Tolerância para relógios levemente adiantados. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

const dataHora = z
  .string({ error: "Informe a data e a hora." })
  .min(1, "Informe a data e a hora.")
  .transform((valor, ctx) => {
    const data = deDatetimeLocal(valor);
    if (!data) {
      ctx.addIssue({ code: "custom", message: "Data ou hora inválida." });
      return z.NEVER;
    }
    if (data.getTime() > Date.now() + TOLERANCIA_FUTURO_MS) {
      ctx.addIssue({ code: "custom", message: "A data e a hora não podem estar no futuro." });
      return z.NEVER;
    }
    return data;
  });

export const esquemaGlicemia = z.object({
  valor: z
    .string({ error: "Informe o valor da glicemia." })
    .trim()
    .min(1, "Informe o valor da glicemia.")
    .regex(/^\d+$/, "Use apenas números inteiros (ex.: 112).")
    .transform(Number)
    .pipe(
      z
        .number()
        .min(GLICEMIA_MIN, `O valor mínimo é ${GLICEMIA_MIN} mg/dL.`)
        .max(GLICEMIA_MAX, `O valor máximo é ${GLICEMIA_MAX} mg/dL.`),
    ),
  medidoEm: dataHora,
});

export const esquemaInsulina = z
  .object({
    tipo: z.enum(["basal", "bolus"], { error: "Escolha o tipo de insulina." }),
    unidades: z
      .string({ error: "Informe a dose." })
      .trim()
      .min(1, "Informe a dose.")
      // aceita vírgula ou ponto como separador decimal
      .regex(/^\d+([.,]\d+)?$/, "Use um número, como 4 ou 4,5.")
      .transform((v) => Number(v.replace(",", ".")))
      .pipe(
        z
          .number()
          .positive("A dose precisa ser maior que zero.")
          .max(INSULINA_MAX, `A dose máxima aceita é ${INSULINA_MAX} U.`)
          .refine((n) => Number.isInteger(n * 2), "Use doses inteiras ou de meia unidade (ex.: 4,5)."),
      ),
    aplicadoEm: dataHora,
    confirmarDoseAlta: z.literal("on").optional(),
  })
  .refine((d) => d.unidades <= INSULINA_DOSE_ALTA || d.confirmarDoseAlta === "on", {
    message: `Dose acima de ${INSULINA_DOSE_ALTA} U. Confira o valor e marque a confirmação.`,
    path: ["confirmarDoseAlta"],
  });

const limite = (rotulo: string) =>
  z
    .string({ error: `Informe o limite de ${rotulo}.` })
    .trim()
    .min(1, `Informe o limite de ${rotulo}.`)
    .regex(/^\d+$/, "Use apenas números inteiros.")
    .transform(Number)
    .pipe(
      z
        .number()
        .min(GLICEMIA_MIN, `Use um valor entre ${GLICEMIA_MIN} e ${GLICEMIA_MAX}.`)
        .max(GLICEMIA_MAX, `Use um valor entre ${GLICEMIA_MIN} e ${GLICEMIA_MAX}.`),
    );

/**
 * Limites das faixas (PROJETO.md, seção 5.1). Precisam estar em ordem crescente:
 * hipo grave < hipo < hiper < hiper grave.
 */
export const esquemaFaixas = z
  .object({
    hipoGrave: limite("hipoglicemia grave"),
    hipo: limite("hipoglicemia"),
    hiper: limite("hiperglicemia"),
    hiperGrave: limite("hiperglicemia grave"),
  })
  .superRefine((f, ctx) => {
    if (f.hipo <= f.hipoGrave) {
      ctx.addIssue({
        code: "custom",
        path: ["hipo"],
        message: `Precisa ser maior que o limite de hipoglicemia grave (${f.hipoGrave}).`,
      });
    }
    if (f.hiper <= f.hipo) {
      ctx.addIssue({
        code: "custom",
        path: ["hiper"],
        message: `Precisa ser maior que o limite de hipoglicemia (${f.hipo}).`,
      });
    }
    if (f.hiperGrave <= f.hiper) {
      ctx.addIssue({
        code: "custom",
        path: ["hiperGrave"],
        message: `Precisa ser maior que o limite de hiperglicemia (${f.hiper}).`,
      });
    }
  });

export type DadosGlicemia = z.infer<typeof esquemaGlicemia>;
export type DadosInsulina = z.infer<typeof esquemaInsulina>;

/** "4.5" → "4,5" para exibição. */
export function formatarUnidades(unidades: number): string {
  return unidades.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
