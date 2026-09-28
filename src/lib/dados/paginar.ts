/** A API do Supabase devolve no máximo 1000 linhas por consulta (max_rows). */
export const TAMANHO_PAGINA = 1000;

/**
 * Busca todas as linhas de uma consulta, página por página.
 * `pagina(de, ate)` deve aplicar `.range(de, ate)` à consulta (com ordenação estável).
 */
export async function buscarTodas<T>(
  pagina: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  limite = 50_000,
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; de < limite; de += TAMANHO_PAGINA) {
    const { data, error } = await pagina(de, de + TAMANHO_PAGINA - 1);
    if (error) throw error;
    todas.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA) break;
  }
  return todas;
}
