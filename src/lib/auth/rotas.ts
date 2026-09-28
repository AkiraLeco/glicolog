/** Rotas acessíveis sem login (inclui subcaminhos). */
export const ROTAS_PUBLICAS = ["/entrar", "/cadastro", "/recuperar-senha", "/auth"];

/** Rotas que não fazem sentido para quem já está logado. */
export const ROTAS_SO_DESLOGADO = ["/entrar", "/cadastro"];

/**
 * Garante que o redirecionamento pós-login vá só para uma página do próprio app.
 * Bloqueia URLs externas ("https://...", "//site.com", "/\site.com").
 */
export function destinoSeguro(proximo: string | null | undefined, padrao = "/"): string {
  if (!proximo) return padrao;
  if (!proximo.startsWith("/") || proximo.startsWith("//") || proximo.startsWith("/\\")) {
    return padrao;
  }
  return proximo;
}
