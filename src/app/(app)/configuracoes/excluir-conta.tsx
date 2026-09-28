"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { excluirConta, type EstadoExclusao } from "./acoes";
import { CONFIRMACAO_EXCLUSAO } from "./constantes";

function BotaoConfirmar({ liberado }: { liberado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={!liberado || pending} aria-busy={pending}>
      {pending ? "Excluindo…" : "Excluir conta"}
    </Button>
  );
}

export function ExcluirConta() {
  const [estado, acao] = useActionState(excluirConta, {} as EstadoExclusao);
  const [digitado, setDigitado] = useState("");
  const id = useId();
  const liberado = digitado.trim().toUpperCase() === CONFIRMACAO_EXCLUSAO;

  return (
    <AlertDialog onOpenChange={(aberto) => !aberto && setDigitado("")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden />
          Excluir minha conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={acao} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as suas glicemias, insulinas e configurações serão apagadas para sempre.
              Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {estado.mensagem && (
            <Alert variant="destructive">
              <AlertDescription>{estado.mensagem}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor={id}>
              Para confirmar, digite <strong>{CONFIRMACAO_EXCLUSAO}</strong>
            </Label>
            <Input
              id={id}
              name="confirmacao"
              autoComplete="off"
              autoCapitalize="characters"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <BotaoConfirmar liberado={liberado} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
