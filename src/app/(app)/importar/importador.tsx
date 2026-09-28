"use client";

import { CircleCheck, FileUp, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { CSV_TAMANHO_MAXIMO } from "@/lib/dominio/csv";
import { formatarDiaExtenso } from "@/lib/dominio/datas";
import {
  importarGlicemias,
  previsualizarImportacao,
  type Previa,
  type ResultadoImportacao,
} from "./acoes";

type Estado =
  | { etapa: "escolher"; erro?: string }
  | { etapa: "previa"; nome: string; texto: string; previa: Extract<Previa, { ok: true }> }
  | { etapa: "resultado"; resultado: Extract<ResultadoImportacao, { ok: true }> };

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Contador({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className="grid gap-0.5 rounded-lg border p-3">
      <span className={destaque ? "text-2xl font-semibold" : "text-2xl font-semibold text-muted-foreground"}>
        {valor}
      </span>
      <span className="text-sm text-muted-foreground">{rotulo}</span>
    </div>
  );
}

export function Importador() {
  const [estado, setEstado] = useState<Estado>({ etapa: "escolher" });
  const [pendente, iniciar] = useTransition();
  const [erroImportacao, setErroImportacao] = useState<string>();
  const campoArquivo = useRef<HTMLInputElement>(null);
  const id = useId();

  function recomecar() {
    setEstado({ etapa: "escolher" });
    setErroImportacao(undefined);
    if (campoArquivo.current) campoArquivo.current.value = "";
  }

  function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    if (arquivo.size > CSV_TAMANHO_MAXIMO) {
      setEstado({ etapa: "escolher", erro: "O arquivo é maior que 1 MB. Divida em arquivos menores." });
      return;
    }
    iniciar(async () => {
      const texto = await arquivo.text();
      const previa = await previsualizarImportacao(texto);
      setEstado(
        previa.ok
          ? { etapa: "previa", nome: arquivo.name, texto, previa }
          : { etapa: "escolher", erro: previa.erro },
      );
    });
  }

  function importar() {
    if (estado.etapa !== "previa") return;
    setErroImportacao(undefined);
    iniciar(async () => {
      const resultado = await importarGlicemias(estado.texto);
      if (resultado.ok) setEstado({ etapa: "resultado", resultado });
      else setErroImportacao(resultado.erro);
    });
  }

  if (estado.etapa === "resultado") {
    const { importadas, ignoradas } = estado.resultado;
    return (
      <div className="grid gap-4" role="status">
        <Alert>
          <CircleCheck aria-hidden />
          <AlertTitle>
            {importadas === 1 ? "1 glicemia importada." : `${importadas} glicemias importadas.`}
          </AlertTitle>
          {ignoradas > 0 && (
            <AlertDescription>
              {plural(ignoradas, "linha já existia e foi ignorada", "linhas já existiam e foram ignoradas")}.
            </AlertDescription>
          )}
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Link href="/historico?dias=365" className={buttonVariants()}>
            Ver no histórico
          </Link>
          <Link href="/grafico?periodo=30d" className={buttonVariants({ variant: "outline" })}>
            Ver no gráfico
          </Link>
          <Button variant="ghost" onClick={recomecar}>
            Importar outro arquivo
          </Button>
        </div>
      </div>
    );
  }

  if (estado.etapa === "previa") {
    const { previa, nome } = estado;
    return (
      <div className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="font-medium">
            Pré-visualização de <span className="break-all">{nome}</span>
          </h2>
          {previa.periodo && (
            <p className="text-sm text-muted-foreground first-letter:uppercase">
              {formatarDiaExtenso(new Date(previa.periodo[0]))}
              {" até "}
              {formatarDiaExtenso(new Date(previa.periodo[1]))}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
          <Contador valor={previa.novas} rotulo="novas, serão importadas" destaque />
          <Contador valor={previa.existentes} rotulo="já existem" />
          <Contador valor={previa.repetidas.length} rotulo="repetidas no arquivo" />
          <Contador valor={previa.rejeitadas.length} rotulo="com erro" />
        </div>

        {previa.rejeitadas.length > 0 && (
          <div className="grid gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 text-destructive" aria-hidden />
              Linhas com erro (não serão importadas)
            </h3>
            {/* tabIndex: permite rolar a lista de erros pelo teclado */}
            <div
              className="max-h-72 overflow-auto rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              tabIndex={0}
              role="region"
              aria-label="Lista de linhas com erro"
            >
              <table className="w-full text-sm" aria-label="Linhas com erro">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left text-muted-foreground">
                    <th scope="col" className="w-16 px-3 py-2 font-medium">Linha</th>
                    <th scope="col" className="px-3 py-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previa.rejeitadas.map((r) => (
                    <tr key={r.linha}>
                      <td className="px-3 py-1.5 tabular-nums">{r.linha}</td>
                      <td className="px-3 py-1.5">{r.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {previa.repetidas.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Repetidas no arquivo (ignoradas):{" "}
            {previa.repetidas.map((r) => `linha ${r.linha} = linha ${r.igualA}`).join("; ")}.
          </p>
        )}

        {erroImportacao && (
          <Alert variant="destructive">
            <AlertDescription>{erroImportacao}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={importar} disabled={pendente || previa.novas === 0} aria-busy={pendente}>
            {pendente && <LoaderCircle className="animate-spin" aria-hidden />}
            {previa.novas === 0
              ? "Nada novo para importar"
              : `Importar ${plural(previa.novas, "glicemia", "glicemias")}`}
          </Button>
          <Button variant="outline" onClick={recomecar} disabled={pendente}>
            Escolher outro arquivo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {estado.erro && (
        <Alert variant="destructive">
          <AlertDescription>{estado.erro}</AlertDescription>
        </Alert>
      )}
      <label
        htmlFor={id}
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
      >
        {pendente ? (
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <FileUp className="size-6 text-muted-foreground" aria-hidden />
        )}
        <span className="font-medium">{pendente ? "Lendo o arquivo…" : "Escolher arquivo CSV"}</span>
        <span className="text-sm text-muted-foreground">Até 1 MB e 5.000 linhas</span>
      </label>
      <input
        ref={campoArquivo}
        id={id}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        disabled={pendente}
        onChange={(e) => aoEscolherArquivo(e.target.files?.[0])}
      />
    </div>
  );
}
