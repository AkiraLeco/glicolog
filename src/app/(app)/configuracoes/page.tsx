import type { Metadata } from "next";
import { EmConstrucao } from "@/components/em-construcao";

export const metadata: Metadata = { title: "Ajustes" };

export default function PaginaConfiguracoes() {
  return <EmConstrucao titulo="Ajustes" descricao="Em breve: ajustar as faixas de glicemia e gerenciar sua conta." />;
}
