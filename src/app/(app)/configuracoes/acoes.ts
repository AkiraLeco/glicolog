"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaFaixas } from "@/lib/dominio/validacao";
import { texto, validarFormulario, type ErrosDeCampo } from "@/lib/formulario";
import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";
import { CONFIRMACAO_EXCLUSAO } from "./constantes";

export type EstadoFaixas = { erros?: ErrosDeCampo; mensagem?: string; salvoEm?: number };

export async function atualizarFaixas(
  _anterior: EstadoFaixas,
  formData: FormData,
): Promise<EstadoFaixas> {
  const validacao = validarFormulario(esquemaFaixas, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const usuario = await obterUsuario();
  if (!usuario) redirect("/entrar");

  const supabase = await criarClienteServidor();
  const { hipoGrave, hipo, hiper, hiperGrave } = validacao.dados;
  const { data, error } = await supabase
    .from("configuracao")
    .update({
      limite_hipo_grave: hipoGrave,
      limite_hipo: hipo,
      limite_hiper: hiper,
      limite_hiper_grave: hiperGrave,
    })
    .eq("user_id", usuario.id)
    .select("user_id");

  if (error || !data.length) {
    return { mensagem: "Não foi possível salvar as faixas. Tente de novo." };
  }
  revalidatePath("/", "layout");
  return { salvoEm: Date.now() };
}

export type EstadoExclusao = { mensagem?: string };

export async function excluirConta(
  _anterior: EstadoExclusao,
  formData: FormData,
): Promise<EstadoExclusao> {
  if (texto(formData, "confirmacao").trim().toUpperCase() !== CONFIRMACAO_EXCLUSAO) {
    return { mensagem: `Digite ${CONFIRMACAO_EXCLUSAO} para confirmar.` };
  }

  const supabase = await criarClienteServidor();
  // Apaga o usuário; glicemias, insulinas e configuração vão junto (on delete cascade).
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) return { mensagem: "Não foi possível excluir a conta. Tente de novo." };

  // A sessão já não vale mais; limpa os cookies locais.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entrar?conta=excluida");
}
