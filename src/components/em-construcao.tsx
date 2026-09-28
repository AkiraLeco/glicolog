import { Construction } from "lucide-react";

/** Página provisória para seções que ainda serão construídas. */
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      <p className="flex items-center gap-2 text-muted-foreground">
        <Construction className="size-4 shrink-0" aria-hidden />
        {descricao}
      </p>
    </div>
  );
}
