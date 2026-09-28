import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AVISO_MEDICO } from "@/lib/textos";

export const metadata: Metadata = { title: "Sobre" };

export default function PaginaSobre() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sobre o Glicolog</h1>

      <Alert>
        <TriangleAlert aria-hidden />
        <AlertTitle>Aviso importante</AlertTitle>
        <AlertDescription>
          {AVISO_MEDICO} Ele não sugere nem calcula doses de insulina. Siga sempre as orientações
          da sua equipe de saúde.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>O que o app faz</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            O Glicolog é um diário para quem tem diabetes tipo 1 registrar as medições de
            glicemia e as doses de insulina aplicadas, e acompanhar como os valores mudam ao
            longo do tempo — no celular ou no computador.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Registro rápido de glicemia (mg/dL) e insulina (basal ou bolus).</li>
            <li>Histórico por dia, com opção de editar e excluir.</li>
            <li>Gráfico por dia, 7 dias ou 30 dias, com a faixa-alvo destacada.</li>
            <li>Importação de glicemias a partir de um arquivo CSV.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Glossário</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-medium">Glicemia</dt>
              <dd className="text-muted-foreground">
                Quantidade de glicose (açúcar) no sangue, medida em mg/dL.
              </dd>
            </div>
            <div>
              <dt className="flex flex-wrap items-center gap-2 font-medium">
                Faixa-alvo <IndicadorFaixa classificacao="alvo" />
              </dt>
              <dd className="text-muted-foreground">
                Intervalo considerado adequado — pelo consenso internacional, de 70 a 180 mg/dL.
                Você pode ajustar os limites em Ajustes, conforme orientação médica.
              </dd>
            </div>
            <div>
              <dt className="flex flex-wrap items-center gap-2 font-medium">
                Hipoglicemia <IndicadorFaixa classificacao="hipo" />
              </dt>
              <dd className="text-muted-foreground">
                Glicemia baixa (abaixo de 70 mg/dL). Abaixo de 54 mg/dL é considerada grave. Pode
                causar tremor, suor, confusão e desmaio.
              </dd>
            </div>
            <div>
              <dt className="flex flex-wrap items-center gap-2 font-medium">
                Hiperglicemia <IndicadorFaixa classificacao="hiper" />
              </dt>
              <dd className="text-muted-foreground">
                Glicemia alta (acima de 180 mg/dL). Acima de 250 mg/dL é considerada grave.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Insulina basal</dt>
              <dd className="text-muted-foreground">
                Insulina de ação lenta, geralmente aplicada 1 ou 2 vezes por dia, que mantém o nível
                &ldquo;de fundo&rdquo;.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Insulina bolus</dt>
              <dd className="text-muted-foreground">
                Insulina rápida, aplicada nas refeições ou para corrigir uma glicemia alta.
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" aria-hidden />
            <h2>Privacidade</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            Dados de saúde são dados sensíveis (LGPD). Seus registros ficam protegidos por regras
            no próprio banco de dados: cada conta só consegue ver e alterar os próprios dados.
          </p>
          <p>
            Você pode excluir sua conta a qualquer momento em Ajustes — isso apaga todos os seus
            registros para sempre.
          </p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Projeto de estudo e portfólio. Código aberto em{" "}
        <a
          href="https://github.com/AkiraLeco/glicolog"
          className="text-foreground underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          github.com/AkiraLeco/glicolog
        </a>
        .
      </p>
    </div>
  );
}
