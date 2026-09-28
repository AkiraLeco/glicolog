import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { proximo, erro, conta } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Entrar</h1>
        </CardTitle>
        <CardDescription>Acesse seu diário de glicemia.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {conta === "excluida" && (
          <Alert>
            <AlertDescription>
              Sua conta e todos os seus dados foram excluídos.
            </AlertDescription>
          </Alert>
        )}
        {erro === "link-invalido" && (
          <Alert variant="destructive">
            <AlertDescription>
              Esse link expirou ou já foi usado. Entre com sua senha ou peça um novo link.
            </AlertDescription>
          </Alert>
        )}
        <FormularioEntrar proximo={typeof proximo === "string" ? proximo : undefined} />
        <div className="grid gap-2 text-center text-sm">
          <Link href="/recuperar-senha" className="underline underline-offset-4">
            Esqueci minha senha
          </Link>
          <p className="text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-foreground underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
