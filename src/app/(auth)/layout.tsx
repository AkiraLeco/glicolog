import { Droplet } from "lucide-react";

export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Droplet className="size-6 text-destructive" aria-hidden />
        Glicolog
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
