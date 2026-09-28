import type { Metadata } from "next";
import { EmConstrucao } from "@/components/em-construcao";

export const metadata: Metadata = { title: "Histórico" };

export default function PaginaHistorico() {
  return <EmConstrucao titulo="Histórico" descricao="Em breve: todos os registros, agrupados por dia, com opção de editar e excluir." />;
}
