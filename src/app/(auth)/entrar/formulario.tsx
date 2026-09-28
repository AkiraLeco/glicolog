"use client";

import { useActionState } from "react";
import { BotaoEnviar, Campo, CampoSenha } from "@/components/auth/campos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { entrar, type EstadoFormulario } from "../acoes";

export function FormularioEntrar({ proximo }: { proximo?: string }) {
  const [estado, acao] = useActionState(entrar, {} as EstadoFormulario);

  return (
    <form action={acao} noValidate className="grid gap-4">
      {proximo && <input type="hidden" name="proximo" value={proximo} />}
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
        rotulo="Senha"
        name="senha"
        autoComplete="current-password"
        erros={estado.erros?.senha}
        required
      />
      <BotaoEnviar>Entrar</BotaoEnviar>
    </form>
  );
}
