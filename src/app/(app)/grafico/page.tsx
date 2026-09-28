import type { Metadata } from "next";
import { EmConstrucao } from "@/components/em-construcao";

export const metadata: Metadata = { title: "Gráfico" };

export default function PaginaGrafico() {
  return <EmConstrucao titulo="Gráfico" descricao="Em breve: gráfico da glicemia por dia, 7 dias e 30 dias." />;
}
