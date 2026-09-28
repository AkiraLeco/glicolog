import type { Metadata } from "next";
import { FormularioRecuperarSenha } from "./formulario";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function PaginaRecuperarSenha() {
  return <FormularioRecuperarSenha />;
}
