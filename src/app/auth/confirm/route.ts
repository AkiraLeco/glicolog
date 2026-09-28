import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/auth/rotas";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Destino dos links enviados por e-mail (confirmação de cadastro e recuperação de senha).
 * Aceita os dois formatos do Supabase: `?code=` (PKCE) e `?token_hash=&type=`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const proximo = destinoSeguro(searchParams.get("proximo"));

  const supabase = await criarClienteServidor();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  const destino = ok ? proximo : "/entrar?erro=link-invalido";
  return NextResponse.redirect(new URL(destino, request.url));
}
