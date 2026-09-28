"use client";

import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { excluirRegistro } from "@/app/(app)/acoes";
import {
  ConteudoDialogoGlicemia,
  ConteudoDialogoInsulina,
} from "@/components/registro/dialogos-registro";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Registro } from "@/lib/dados/tipos";
import { formatarHora } from "@/lib/dominio/datas";
import type { Faixas } from "@/lib/dominio/faixas";
import { formatarUnidades } from "@/lib/dominio/validacao";

/** "glicemia de 212 mg/dL das 21:50" / "insulina bolus de 4,5 U das 12:10" */
function descrever(registro: Registro) {
  const hora = formatarHora(registro.em);
  return registro.tipo === "glicemia"
    ? `glicemia de ${registro.valor} mg/dL das ${hora}`
    : `insulina ${registro.tipoInsulina} de ${formatarUnidades(registro.unidades)} U das ${hora}`;
}

/** Menu "⋯" de um registro, com Editar e Excluir. */
export function AcoesRegistro({ registro, faixas }: { registro: Registro; faixas: Faixas }) {
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const descricao = descrever(registro);

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await excluirRegistro(registro.tipo, registro.id);
      if (resultado.ok) {
        setExcluindo(false);
        toast.success(registro.tipo === "glicemia" ? "Glicemia excluída." : "Insulina excluída.");
      } else {
        toast.error(resultado.mensagem);
      }
    });
  }

  return (
    <>
      {/* modal={false}: evita conflito de foco ao abrir um diálogo a partir do menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações: ${descricao}`}>
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditando(true)}>
            <Pencil aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setExcluindo(true)}>
            <Trash2 aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editando} onOpenChange={setEditando}>
        {editando &&
          (registro.tipo === "glicemia" ? (
            <ConteudoDialogoGlicemia
              faixas={faixas}
              inicial={registro}
              aoSalvar={() => setEditando(false)}
            />
          ) : (
            <ConteudoDialogoInsulina inicial={registro} aoSalvar={() => setEditando(false)} />
          ))}
      </Dialog>

      <AlertDialog open={excluindo} onOpenChange={(abrir) => !pendente && setExcluindo(abrir)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              A {descricao} será apagada. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendente}>Cancelar</AlertDialogCancel>
            {/* Botão comum (não AlertDialogAction) para o diálogo só fechar depois de excluir */}
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={pendente}
              aria-busy={pendente}
            >
              {pendente ? "Excluindo…" : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
