import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Renova a sessão do Supabase nos cookies e informa se há usuário logado.
 * A resposta retornada carrega os cookies atualizados e deve ser usada (ou ter
 * seus cookies copiados) por quem chamar.
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Não coloque código entre a criação do cliente e getClaims():
  // é essa chamada que renova a sessão.
  const { data } = await supabase.auth.getClaims();

  return { response, logado: Boolean(data?.claims) };
}
