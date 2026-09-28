import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";
import { ROTAS_PUBLICAS, ROTAS_SO_DESLOGADO } from "@/lib/auth/rotas";

export async function proxy(request: NextRequest) {
  const { response, logado } = await atualizarSessao(request);
  const { pathname, search } = request.nextUrl;

  const ehPublica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  if (!logado && !ehPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("proximo", pathname + search);
    return redirecionarMantendoCookies(url, response);
  }

  if (logado && ROTAS_SO_DESLOGADO.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirecionarMantendoCookies(url, response);
  }

  return response;
}

function redirecionarMantendoCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
