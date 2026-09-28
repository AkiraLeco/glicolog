import { z } from "zod";

export type ErrosDeCampo = Partial<Record<string, string[]>>;

/** Valida um FormData com um esquema e devolve os dados ou os erros por campo. */
export function validarFormulario<T extends z.ZodType>(
  esquema: T,
  formData: FormData,
): { ok: true; dados: z.infer<T> } | { ok: false; erros: ErrosDeCampo } {
  const resultado = esquema.safeParse(Object.fromEntries(formData));
  if (resultado.success) return { ok: true, dados: resultado.data };
  return { ok: false, erros: z.flattenError(resultado.error).fieldErrors as ErrosDeCampo };
}

/** Lê um campo de texto do FormData ("" se ausente). */
export function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}
