"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  esquemaCadastro,
  esquemaEntrar,
  esquemaRecuperarSenha,
  esquemaRedefinirSenha,
  validarFormulario,
  type ErrosDeCampo,
} from "@/lib/auth/esquemas";
import { mensagemDeErro } from "@/lib/auth/mensagens";
import { destinoSeguro } from "@/lib/auth/rotas";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormulario = {
  erros?: ErrosDeCampo;
  mensagem?: string;
  /** Valores para repreencher o formulário após um erro (nunca a senha). */
  email?: string;
  /** true quando um e-mail foi enviado com sucesso. */
  enviado?: boolean;
};

/** Endereço do app (ex.: http://localhost:3000), usado nos links dos e-mails. */
async function obterOrigem() {
  const h = await headers();
  const origem = h.get("origin");
  if (origem) return origem;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? "http";
  return `${protocolo}://${host}`;
}

function texto(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}

export async function entrar(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = validarFormulario(esquemaEntrar, formData);
  if (!validacao.ok) return { erros: validacao.erros, email: texto(formData, "email") };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: validacao.dados.email,
    password: validacao.dados.senha,
  });
  if (error) return { mensagem: mensagemDeErro(error), email: validacao.dados.email };

  redirect(destinoSeguro(texto(formData, "proximo")));
}

export async function cadastrar(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = validarFormulario(esquemaCadastro, formData);
  if (!validacao.ok) return { erros: validacao.erros, email: texto(formData, "email") };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: validacao.dados.email,
    password: validacao.dados.senha,
    options: { emailRedirectTo: `${await obterOrigem()}/auth/confirm?proximo=/` },
  });
  if (error) return { mensagem: mensagemDeErro(error), email: validacao.dados.email };

  // Mesmo que o e-mail já tenha conta, o Supabase não informa — e nós também não,
  // para não revelar quem usa o app.
  return { enviado: true, email: validacao.dados.email };
}

export async function recuperarSenha(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = validarFormulario(esquemaRecuperarSenha, formData);
  if (!validacao.ok) return { erros: validacao.erros, email: texto(formData, "email") };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(validacao.dados.email, {
    redirectTo: `${await obterOrigem()}/auth/confirm?proximo=/redefinir-senha`,
  });
  // Só mostramos erros de limite de envio; qualquer outro resultado recebe a mesma
  // resposta, para não revelar se o e-mail tem conta.
  if (error?.code === "over_email_send_rate_limit") {
    return { mensagem: mensagemDeErro(error), email: validacao.dados.email };
  }

  return { enviado: true, email: validacao.dados.email };
}

export async function redefinirSenha(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const validacao = validarFormulario(esquemaRedefinirSenha, formData);
  if (!validacao.ok) return { erros: validacao.erros };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: validacao.dados.senha });
  if (error) return { mensagem: mensagemDeErro(error) };

  redirect("/");
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
