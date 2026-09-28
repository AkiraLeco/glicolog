import { MailCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Tela exibida depois que um e-mail (confirmação ou recuperação) foi enviado. */
export function AvisoEmailEnviado({
  email,
  children,
}: {
  email?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <MailCheck className="size-8 text-muted-foreground" aria-hidden />
        <CardTitle>
          <h1>Confira seu e-mail</h1>
        </CardTitle>
        <CardDescription role="status">
          {email ? (
            <>
              Se <strong className="text-foreground">{email}</strong> estiver correto, você vai
              receber uma mensagem em instantes.
            </>
          ) : (
            "Você vai receber uma mensagem em instantes."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <p>{children}</p>
        <p className="text-muted-foreground">
          Não chegou? Veja a caixa de spam. O remetente é o Supabase, o serviço que cuida do login
          do Glicolog.
        </p>
        <Link href="/entrar" className="text-center underline underline-offset-4">
          Voltar para Entrar
        </Link>
      </CardContent>
    </Card>
  );
}
