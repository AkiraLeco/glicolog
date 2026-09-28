import type { Metadata } from "next";
import { EmConstrucao } from "@/components/em-construcao";

export const metadata: Metadata = { title: "Importar" };

export default function PaginaImportar() {
  return <EmConstrucao titulo="Importar" descricao="Em breve: importar glicemias de um arquivo CSV." />;
}
