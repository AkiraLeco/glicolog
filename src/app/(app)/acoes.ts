"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { esquemaGlicemia, esquemaInsulina } from "@/lib/dominio/validacao";
import { texto, validarFormulario, type ErrosDeCampo } from "@/lib/formulario";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoRegistro = {
  erros?: ErrosDeCampo;
  mensagem?: string;
  /** Muda a cada registro salvo, para o formulário saber que deu certo. */
  salvoEm?: number;
};

const ERRO_GENERICO = "Não foi possível salvar. Verifique sua conexão e tente de novo.";
const NAO_ENCONTRADO = "Esse registro não existe mais. Atualize a página.";
const GLICEMIA_DUPLICADA = "Já existe uma glicemia com esse valor nesse mesmo horário.";

const esquemaId = z.uuid();

// Todas as escritas dependem do RLS: o banco só aceita linhas do usuário logado.

function concluir(): EstadoRegistro {
  revalidatePath("/", "layout");
  return { salvoEm: Date.now() };
}

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
    return { mensagem: error.code === "23505" ? GLICEMIA_DUPLICADA : ERRO_GENERICO };
  }
  return concluir();
}

export async function atualizarGlicemia(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const id = esquemaId.safeParse(texto(formData, "id"));
  if (!id.success) return { mensagem: NAO_ENCONTRADO };
  const validacao = validarFormulario(esquemaGlicemia, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("glicemias")
    .update({
      valor_mgdl: validacao.dados.valor,
      medido_em: validacao.dados.medidoEm.toISOString(),
    })
    .eq("id", id.data)
    .select("id");

  if (error) return { mensagem: error.code === "23505" ? GLICEMIA_DUPLICADA : ERRO_GENERICO };
  if (!data.length) return { mensagem: NAO_ENCONTRADO };
  return concluir();
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
  return concluir();
}

export async function atualizarInsulina(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const id = esquemaId.safeParse(texto(formData, "id"));
  if (!id.success) return { mensagem: NAO_ENCONTRADO };
  const validacao = validarFormulario(esquemaInsulina, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("insulinas")
    .update({
      tipo: validacao.dados.tipo,
      unidades: validacao.dados.unidades,
      aplicado_em: validacao.dados.aplicadoEm.toISOString(),
    })
    .eq("id", id.data)
    .select("id");

  if (error) return { mensagem: ERRO_GENERICO };
  if (!data.length) return { mensagem: NAO_ENCONTRADO };
  return concluir();
}

export async function excluirRegistro(
  tipo: "glicemia" | "insulina",
  id: string,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const idValido = esquemaId.safeParse(id);
  if (!idValido.success || (tipo !== "glicemia" && tipo !== "insulina")) {
    return { ok: false, mensagem: NAO_ENCONTRADO };
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from(tipo === "glicemia" ? "glicemias" : "insulinas")
    .delete()
    .eq("id", idValido.data)
    .select("id");

  if (error) return { ok: false, mensagem: "Não foi possível excluir. Tente de novo." };
  if (!data.length) return { ok: false, mensagem: NAO_ENCONTRADO };
  revalidatePath("/", "layout");
  return { ok: true };
}
