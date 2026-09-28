"use client";

import { useActionState } from "react";
import { BotaoEnviar, CampoSenha } from "@/components/auth/campos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SENHA_MINIMO } from "@/lib/auth/esquemas";
import { redefinirSenha, type EstadoFormulario } from "../acoes";

export function FormularioRedefinirSenha() {
  const [estado, acao] = useActionState(redefinirSenha, {} as EstadoFormulario);

  return (
    <form action={acao} noValidate className="grid gap-4">
      {estado.mensagem && (
        <Alert variant="destructive">
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      <CampoSenha
        rotulo={`Nova senha (mínimo ${SENHA_MINIMO} caracteres)`}
        name="senha"
        autoComplete="new-password"
        minLength={SENHA_MINIMO}
        erros={estado.erros?.senha}
        required
      />
      <CampoSenha
        rotulo="Repita a nova senha"
        name="confirmacao"
        autoComplete="new-password"
        erros={estado.erros?.confirmacao}
        required
      />
      <BotaoEnviar>Salvar nova senha</BotaoEnviar>
    </form>
  );
}
