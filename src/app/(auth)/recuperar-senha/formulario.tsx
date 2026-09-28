"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoEmailEnviado } from "@/components/auth/aviso-email-enviado";
import { BotaoEnviar, Campo } from "@/components/auth/campos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recuperarSenha, type EstadoFormulario } from "../acoes";

export function FormularioRecuperarSenha() {
  const [estado, acao] = useActionState(recuperarSenha, {} as EstadoFormulario);

  if (estado.enviado) {
    return (
      <AvisoEmailEnviado email={estado.email}>
        Se existir uma conta com esse e-mail, a mensagem terá um link para criar uma senha nova.
        Abra o link neste mesmo navegador.
      </AvisoEmailEnviado>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Recuperar senha</h1>
        </CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para você criar uma senha nova.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={acao} noValidate className="grid gap-4">
          {estado.mensagem && (
            <Alert variant="destructive">
              <AlertDescription>{estado.mensagem}</AlertDescription>
            </Alert>
          )}
          <Campo
            rotulo="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            defaultValue={estado.email}
            erros={estado.erros?.email}
            required
          />
          <BotaoEnviar>Enviar link</BotaoEnviar>
        </form>
        <Link href="/entrar" className="text-center text-sm underline underline-offset-4">
          Voltar para Entrar
        </Link>
      </CardContent>
    </Card>
  );
}
