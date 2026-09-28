"use server";

import { revalidatePath } from "next/cache";
import { esquemaGlicemia, esquemaInsulina } from "@/lib/dominio/validacao";
import { validarFormulario, type ErrosDeCampo } from "@/lib/formulario";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoRegistro = {
  erros?: ErrosDeCampo;
  mensagem?: string;
  /** Muda a cada registro salvo, para o formulário saber que deu certo. */
  salvoEm?: number;
};

const ERRO_GENERICO = "Não foi possível salvar. Verifique sua conexão e tente de novo.";

export async function registrarGlicemia(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const validacao = validarFormulario(esquemaGlicemia, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("glicemias").insert({
    valor_mgdl: validacao.dados.valor,
    medido_em: validacao.dados.medidoEm.toISOString(),
  });

  if (error) {
    // 23505 = violação de unicidade (mesmo valor no mesmo horário)
    if (error.code === "23505") {
      return { mensagem: "Já existe uma glicemia com esse valor nesse mesmo horário." };
    }
    return { mensagem: ERRO_GENERICO };
  }

  revalidatePath("/", "layout");
  return { salvoEm: Date.now() };
}

export async function registrarInsulina(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const validacao = validarFormulario(esquemaInsulina, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("insulinas").insert({
    tipo: validacao.dados.tipo,
    unidades: validacao.dados.unidades,
    aplicado_em: validacao.dados.aplicadoEm.toISOString(),
  });

  if (error) return { mensagem: ERRO_GENERICO };

  revalidatePath("/", "layout");
  return { salvoEm: Date.now() };
}
