"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotaoEnviar, Campo, CampoSenha } from "@/components/auth/campos";
import { AvisoEmailEnviado } from "@/components/auth/aviso-email-enviado";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SENHA_MINIMO } from "@/lib/auth/esquemas";
import { cadastrar, type EstadoFormulario } from "../acoes";

export function FormularioCadastro() {
  const [estado, acao] = useActionState(cadastrar, {} as EstadoFormulario);

  if (estado.enviado) {
    return (
      <AvisoEmailEnviado email={estado.email}>
        Clique no link do e-mail para confirmar sua conta. Abra o link neste mesmo navegador.
      </AvisoEmailEnviado>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Criar conta</h1>
        </CardTitle>
        <CardDescription>Seus registros ficam salvos e acessíveis de qualquer aparelho.</CardDescription>
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
          <CampoSenha
            rotulo={`Senha (mínimo ${SENHA_MINIMO} caracteres)`}
            name="senha"
            autoComplete="new-password"
            minLength={SENHA_MINIMO}
            erros={estado.erros?.senha}
            required
          />
          <CampoSenha
            rotulo="Repita a senha"
            name="confirmacao"
            autoComplete="new-password"
            erros={estado.erros?.confirmacao}
            required
          />
          <BotaoEnviar>Criar conta</BotaoEnviar>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
