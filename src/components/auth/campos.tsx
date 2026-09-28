"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoProps = Omit<ComponentProps<typeof Input>, "id"> & {
  rotulo: string;
  name: string;
  erros?: string[];
};

/** Campo de formulário com rótulo e mensagens de erro acessíveis. */
export function Campo({ rotulo, erros, ...props }: CampoProps) {
  const id = useId();
  const idErro = `${id}-erro`;
  const temErro = Boolean(erros?.length);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        aria-invalid={temErro || undefined}
        aria-describedby={temErro ? idErro : undefined}
        {...props}
      />
      {temErro && (
        <p id={idErro} className="text-sm text-destructive">
          {erros![0]}
        </p>
      )}
    </div>
  );
}

/** Campo de senha com botão para mostrar/ocultar o que foi digitado. */
export function CampoSenha({ rotulo, erros, ...props }: Omit<CampoProps, "type">) {
  const id = useId();
  const idErro = `${id}-erro`;
  const temErro = Boolean(erros?.length);
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visivel ? "text" : "password"}
          className="pr-12"
          aria-invalid={temErro || undefined}
          aria-describedby={temErro ? idErro : undefined}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 h-full"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </Button>
      </div>
      {temErro && (
        <p id={idErro} className="text-sm text-destructive">
          {erros![0]}
        </p>
      )}
    </div>
  );
}

/** Botão de envio que mostra "carregando" enquanto o formulário é processado. */
export function BotaoEnviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
