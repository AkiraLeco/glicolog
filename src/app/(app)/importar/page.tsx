import { Download } from "lucide-react";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Importador } from "./importador";

export const metadata: Metadata = { title: "Importar" };

export default function PaginaImportar() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Importar glicemias</h1>
        <p className="text-sm text-muted-foreground">
          Traga medições de uma planilha ou de um arquivo exportado do seu glicosímetro.
        </p>
      </div>

      <Card>
        <CardContent>
          <Importador />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Formato do arquivo</h2>
          </CardTitle>
          <CardDescription>
            Um arquivo CSV (pode ser salvo pelo Excel ou Google Planilhas) com estas três colunas
            na primeira linha:
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div
            className="overflow-x-auto rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Exemplo de arquivo"
          >
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th scope="col" className="px-3 py-2">data</th>
                  <th scope="col" className="px-3 py-2">hora</th>
                  <th scope="col" className="px-3 py-2">glicemia_mgdl</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-1.5">2026-09-27</td>
                  <td className="px-3 py-1.5">07:30</td>
                  <td className="px-3 py-1.5">112</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5">27/09/2026</td>
                  <td className="px-3 py-1.5">12:15</td>
                  <td className="px-3 py-1.5">165</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">data</strong>: AAAA-MM-DD ou DD/MM/AAAA.
            </li>
            <li>
              <strong className="text-foreground">hora</strong>: HH:MM, no horário de Brasília.
            </li>
            <li>
              <strong className="text-foreground">glicemia_mgdl</strong>: número inteiro de 20 a 600.
            </li>
            <li>Separador vírgula ou ponto e vírgula (o Excel em português usa ponto e vírgula).</li>
            <li>
              Linhas com erro (como <code>HI</code>, <code>LO</code> ou valores fora do intervalo)
              aparecem na pré-visualização e não são importadas. Glicemias que já existem são
              ignoradas, então importar o mesmo arquivo duas vezes não duplica nada.
            </li>
          </ul>
          <a
            href="/modelo-glicemias.csv"
            download
            className={buttonVariants({ variant: "outline", className: "justify-self-start" })}
          >
            <Download aria-hidden />
            Baixar modelo
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
