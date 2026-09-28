import type { Metadata } from "next";
import { FormularioCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return <FormularioCadastro />;
}
