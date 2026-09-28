"use client";

import { Droplet, Plus, Syringe } from "lucide-react";
import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  atualizarGlicemia,
  atualizarInsulina,
  registrarGlicemia,
  registrarInsulina,
  type EstadoRegistro,
} from "@/app/(app)/acoes";
import type { RegistroGlicemia, RegistroInsulina } from "@/lib/dados/tipos";
import { IndicadorFaixa } from "@/components/glicemia/indicador-faixa";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paraDatetimeLocal } from "@/lib/dominio/datas";
import { classificar, type Faixas } from "@/lib/dominio/faixas";
import {
  GLICEMIA_MAX,
  GLICEMIA_MIN,
  INSULINA_DOSE_ALTA,
  formatarUnidades,
} from "@/lib/dominio/validacao";
import { cn } from "@/lib/utils";

// Os formulários guardam o que foi digitado em estado (campos controlados):
// o React limpa campos não controlados depois de cada envio, e não queremos
// perder o que a pessoa digitou quando aparece um erro.

/**
 * Erros do último envio, escondendo os de campos que a pessoa já alterou
 * (um erro antigo ao lado de um valor corrigido confunde).
 */
function useErrosDoEnvio(estado: EstadoRegistro) {
  const [estadoVisto, setEstadoVisto] = useState(estado);
  const [editados, setEditados] = useState<ReadonlySet<string>>(new Set());

  // Novo envio → volta a mostrar todos os erros (ajuste de estado durante a renderização).
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    setEditados(new Set());
  }

  return {
    erros: (campo: string) => (editados.has(campo) ? undefined : estado.erros?.[campo]),
    marcarEditado: (campo: string) =>
      setEditados((atual) => (atual.has(campo) ? atual : new Set(atual).add(campo))),
  };
}

/** Chama `aoSalvar` quando a action retorna um novo registro salvo. */
function useAoSalvar(estado: EstadoRegistro, aoSalvar: () => void) {
  useEffect(() => {
    if (estado.salvoEm) aoSalvar();
    // aoSalvar muda a cada renderização; só nos interessa um novo salvoEm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.salvoEm]);
}

function CampoDataHora({
  name,
  valor,
  aoMudar,
  erros,
}: {
  name: string;
  valor: string;
  aoMudar: (v: string) => void;
  erros?: string[];
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Data e hora</Label>
      <Input
        id={id}
        name={name}
        type="datetime-local"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        required
        aria-invalid={erros?.length ? true : undefined}
        aria-describedby={erros?.length ? `${id}-erro` : undefined}
      />
      <Erro id={`${id}-erro`} erros={erros} />
    </div>
  );
}

function Erro({ id, erros }: { id: string; erros?: string[] }) {
  if (!erros?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {erros[0]}
    </p>
  );
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "Salvando…" : "Salvar"}
    </Button>
  );
}

function MensagemGeral({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}

const CLASSE_NUMERO_GRANDE = "h-14 text-3xl font-semibold tabular-nums pointer-coarse:h-14 md:text-3xl";

// ---------------------------------------------------------------------------
// Glicemia
// ---------------------------------------------------------------------------

function FormularioGlicemia({
  faixas,
  inicial,
  aoSalvar,
}: {
  faixas: Faixas;
  /** Registro existente, quando o formulário é de edição. */
  inicial?: RegistroGlicemia;
  aoSalvar: () => void;
}) {
  const [estado, acao] = useActionState(inicial ? atualizarGlicemia : registrarGlicemia, {});
  useAoSalvar(estado, aoSalvar);
  const { erros: errosDe, marcarEditado } = useErrosDoEnvio(estado);

  const id = useId();
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [medidoEm, setMedidoEm] = useState(() => paraDatetimeLocal(inicial?.em ?? new Date()));
  const numero = /^\d+$/.test(valor) ? Number(valor) : NaN;
  const valido = numero >= GLICEMIA_MIN && numero <= GLICEMIA_MAX;
  const erros = errosDe("valor");

  return (
    <form action={acao} noValidate className="grid gap-4">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}
      <MensagemGeral mensagem={estado.mensagem} />
      <div className="grid gap-1.5">
        <Label htmlFor={id}>Valor</Label>
        <div className="flex items-center gap-2">
          <Input
            id={id}
            name="valor"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoFocus
            required
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              marcarEditado("valor");
            }}
            className={CLASSE_NUMERO_GRANDE}
            aria-invalid={erros?.length ? true : undefined}
            aria-describedby={cn(`${id}-ajuda`, erros?.length && `${id}-erro`)}
          />
          <span className="text-muted-foreground">mg/dL</span>
        </div>
        <div id={`${id}-ajuda`} className="min-h-6" aria-live="polite">
          {valido && <IndicadorFaixa classificacao={classificar(numero, faixas)} />}
        </div>
        <Erro id={`${id}-erro`} erros={erros} />
      </div>
      <CampoDataHora
        name="medidoEm"
        valor={medidoEm}
        aoMudar={(v) => {
          setMedidoEm(v);
          marcarEditado("medidoEm");
        }}
        erros={errosDe("medidoEm")}
      />
      <BotaoSalvar />
    </form>
  );
}

/** Conteúdo do diálogo de glicemia (novo registro ou edição). */
export function ConteudoDialogoGlicemia({
  faixas,
  inicial,
  aoSalvar,
}: {
  faixas: Faixas;
  inicial?: RegistroGlicemia;
  aoSalvar: () => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Droplet className="size-5 text-destructive" aria-hidden />
          {inicial ? "Editar glicemia" : "Registrar glicemia"}
        </DialogTitle>
        <DialogDescription>Valor medido no glicosímetro.</DialogDescription>
      </DialogHeader>
      {/* O conteúdo é desmontado ao fechar, então cada abertura começa do zero. */}
      <FormularioGlicemia
        faixas={faixas}
        inicial={inicial}
        aoSalvar={() => {
          aoSalvar();
          toast.success(inicial ? "Glicemia atualizada." : "Glicemia registrada.");
        }}
      />
    </DialogContent>
  );
}

export function RegistrarGlicemia({ faixas, className }: { faixas: Faixas; className?: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="lg" className={cn("gap-2", className)}>
          <Plus aria-hidden />
          Glicemia
        </Button>
      </DialogTrigger>
      <ConteudoDialogoGlicemia faixas={faixas} aoSalvar={() => setAberto(false)} />
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Insulina
// ---------------------------------------------------------------------------

const TIPOS_INSULINA = [
  ["basal", "Basal", "ação lenta"],
  ["bolus", "Bolus", "rápida / refeição"],
] as const;

function FormularioInsulina({
  inicial,
  aoSalvar,
}: {
  inicial?: RegistroInsulina;
  aoSalvar: () => void;
}) {
  const [estado, acao] = useActionState(inicial ? atualizarInsulina : registrarInsulina, {});
  useAoSalvar(estado, aoSalvar);
  const { erros: errosDe, marcarEditado } = useErrosDoEnvio(estado);

  const id = useId();
  const [tipo, setTipo] = useState<string>(inicial?.tipoInsulina ?? "");
  const [unidades, setUnidades] = useState(inicial ? formatarUnidades(inicial.unidades) : "");
  // Editar uma dose alta já confirmada não deve pedir a confirmação de novo.
  const [confirmado, setConfirmado] = useState(
    inicial ? inicial.unidades > INSULINA_DOSE_ALTA : false,
  );
  const [aplicadoEm, setAplicadoEm] = useState(() => paraDatetimeLocal(inicial?.em ?? new Date()));

  const numero = Number(unidades.replace(",", "."));
  const doseAlta = Number.isFinite(numero) && numero > INSULINA_DOSE_ALTA;
  const errosTipo = errosDe("tipo");
  const errosUnidades = errosDe("unidades");
  const errosConfirmar = errosDe("confirmarDoseAlta");

  return (
    <form action={acao} noValidate className="grid gap-4">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}
      <MensagemGeral mensagem={estado.mensagem} />

      <fieldset
        className="grid gap-1.5"
        aria-describedby={errosTipo?.length ? `${id}-tipo-erro` : undefined}
      >
        <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_INSULINA.map(([valor, rotulo, dica]) => (
            <label
              key={valor}
              className="flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="tipo"
                value={valor}
                checked={tipo === valor}
                onChange={() => {
                  setTipo(valor);
                  marcarEditado("tipo");
                }}
                className="sr-only"
              />
              <span className="font-medium">{rotulo}</span>
              <span className="text-xs opacity-80">{dica}</span>
            </label>
          ))}
        </div>
        <Erro id={`${id}-tipo-erro`} erros={errosTipo} />
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor={id}>Dose</Label>
        <div className="flex items-center gap-2">
          <Input
            id={id}
            name="unidades"
            inputMode="decimal"
            autoComplete="off"
            required
            value={unidades}
            onChange={(e) => {
              setUnidades(e.target.value);
              marcarEditado("unidades");
            }}
            className={CLASSE_NUMERO_GRANDE}
            aria-invalid={errosUnidades?.length ? true : undefined}
            aria-describedby={errosUnidades?.length ? `${id}-erro` : undefined}
          />
          <span className="text-muted-foreground">U</span>
        </div>
        <Erro id={`${id}-erro`} erros={errosUnidades} />
      </div>

      {doseAlta && (
        <div className="grid gap-1.5 rounded-lg border border-faixa-hiper/40 bg-faixa-hiper/10 p-3">
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirmarDoseAlta"
              checked={confirmado}
              onChange={(e) => {
                setConfirmado(e.target.checked);
                marcarEditado("confirmarDoseAlta");
              }}
              className="mt-0.5 size-5 shrink-0 accent-primary"
              aria-describedby={errosConfirmar?.length ? `${id}-confirmar-erro` : undefined}
            />
            <span>
              Confirmo a dose de <strong>{formatarUnidades(numero)} U</strong>, acima do comum.
            </span>
          </label>
          <Erro id={`${id}-confirmar-erro`} erros={errosConfirmar} />
        </div>
      )}

      <CampoDataHora
        name="aplicadoEm"
        valor={aplicadoEm}
        aoMudar={(v) => {
          setAplicadoEm(v);
          marcarEditado("aplicadoEm");
        }}
        erros={errosDe("aplicadoEm")}
      />
      <BotaoSalvar />
    </form>
  );
}

/** Conteúdo do diálogo de insulina (novo registro ou edição). */
export function ConteudoDialogoInsulina({
  inicial,
  aoSalvar,
}: {
  inicial?: RegistroInsulina;
  aoSalvar: () => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Syringe className="size-5" aria-hidden />
          {inicial ? "Editar insulina" : "Registrar insulina"}
        </DialogTitle>
        <DialogDescription>Dose aplicada, em unidades (U).</DialogDescription>
      </DialogHeader>
      <FormularioInsulina
        inicial={inicial}
        aoSalvar={() => {
          aoSalvar();
          toast.success(inicial ? "Insulina atualizada." : "Insulina registrada.");
        }}
      />
    </DialogContent>
  );
}

export function RegistrarInsulina({ className }: { className?: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className={cn("gap-2", className)}>
          <Plus aria-hidden />
          Insulina
        </Button>
      </DialogTrigger>
      <ConteudoDialogoInsulina aoSalvar={() => setAberto(false)} />
    </Dialog>
  );
}
