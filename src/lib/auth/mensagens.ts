const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos (veja também a caixa de spam).",
  weak_password: "Senha fraca: use pelo menos 8 caracteres.",
  over_email_send_rate_limit:
    "Muitos e-mails enviados em pouco tempo. Espere alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.",
  same_password: "A nova senha precisa ser diferente da atual.",
  session_not_found: "Sua sessão expirou. Peça um novo link de recuperação de senha.",
};

export const MENSAGEM_GENERICA = "Algo deu errado. Tente novamente.";

/** Traduz um erro do Supabase Auth para uma mensagem em português. */
export function mensagemDeErro(erro: { code?: string } | null | undefined): string {
  return (erro?.code && MENSAGENS[erro.code]) || MENSAGEM_GENERICA;
}
