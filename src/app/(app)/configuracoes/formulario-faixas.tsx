"use client";

import { RotateCcw } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FAIXAS_PADRAO, type Classificacao, type Faixas } from "@/lib/dominio/faixas";
import { atualizarFaixas, type EstadoFaixas } from "./acoes";

type Campo = keyof Faixas;

const CAMPOS: { campo: Campo; rotulo: string; ajuda: string }[] = [
  { campo: "hipoGrave", rotulo: "Hipoglicemia grave abaixo de", ajuda: "Padrão: 54" },
  { campo: "hipo", rotulo: "Hipoglicemia abaixo de", ajuda: "Padrão: 70" },
  { campo: "hiper", rotulo: "Alvo até", ajuda: "Padrão: 180" },
  { campo: "hiperGrave", rotulo: "Hiperglicemia até", ajuda: "Padrão: 250" },
];

const paraTexto = (f: Faixas) =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v)])) as Record<Campo, string>;

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Salvando…" : "Salvar faixas"}
    </Button>
  );
}

/** Mostra as 5 faixas resultantes dos valores digitados. */
function PreVisualizacao({ valores }: { valores: Record<Campo, string> }) {
  const n = (c: Campo) => Number(valores[c]);
  const validos = CAMPOS.every(({ campo }) => /^\d+$/.test(valores[campo]));
  if (!validos) return null;

  const linhas: [Classificacao, string][] = [
    ["hipo_grave", `abaixo de ${n("hipoGrave")}`],
    ["hipo", `${n("hipoGrave")} a ${n("hipo") - 1}`],
    ["alvo", `${n("hipo")} a ${n("hiper")}`],
    ["hiper", `${n("hiper") + 1} a ${n("hiperGrave")}`],
    ["hiper_grave", `acima de ${n("hiperGrave")}`],
  ];

  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Como ficam as faixas (mg/dL)</p>
      <ul className="grid gap-1.5 text-sm">
        {linhas.map(([classificacao, texto]) => (
          <li key={classificacao} className="flex flex-wrap items-center justify-between gap-2">
            <IndicadorFaixa classificacao={classificacao} />
            <span className="tabular-nums text-muted-foreground">{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormularioFaixas({ faixas }: { faixas: Faixas }) {
  const [estado, acao] = useActionState(atualizarFaixas, {} as EstadoFaixas);
  const [valores, setValores] = useState(() => paraTexto(faixas));
  const id = useId();

  useEffect(() => {
    if (estado.salvoEm) toast.success("Faixas salvas.");
  }, [estado.salvoEm]);

  const ehPadrao = CAMPOS.every(({ campo }) => valores[campo] === String(FAIXAS_PADRAO[campo]));

  return (
    <form action={acao} noValidate className="grid gap-4">
      {estado.mensagem && (
        <Alert variant="destructive">
          <AlertDescription>{estado.mensagem}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map(({ campo, rotulo, ajuda }) => {
          const erros = estado.erros?.[campo];
          const idCampo = `${id}-${campo}`;
          return (
            <div key={campo} className="grid content-start gap-1.5">
              <Label htmlFor={idCampo}>{rotulo}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={idCampo}
                  name={campo}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={valores[campo]}
                  onChange={(e) => setValores((v) => ({ ...v, [campo]: e.target.value }))}
                  className="tabular-nums"
                  aria-invalid={erros?.length ? true : undefined}
                  aria-describedby={`${idCampo}-ajuda${erros?.length ? ` ${idCampo}-erro` : ""}`}
                />
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
              <p id={`${idCampo}-ajuda`} className="text-xs text-muted-foreground">
                {ajuda}
              </p>
              {erros?.length ? (
                <p id={`${idCampo}-erro`} className="text-sm text-destructive">
                  {erros[0]}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <PreVisualizacao valores={valores} />

      <div className="flex flex-wrap gap-2">
        <BotaoSalvar />
        <Button
          type="button"
          variant="outline"
          disabled={ehPadrao}
          onClick={() => setValores(paraTexto(FAIXAS_PADRAO))}
        >
          <RotateCcw aria-hidden />
          Restaurar padrão
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Os valores padrão seguem o consenso internacional. Se o seu médico indicou metas
        diferentes, ajuste aqui. &ldquo;Restaurar padrão&rdquo; preenche os campos; clique em
        Salvar para aplicar.
      </p>
    </form>
  );
}
