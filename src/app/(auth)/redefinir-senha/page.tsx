import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioRedefinirSenha } from "./formulario";

export const metadata: Metadata = { title: "Nova senha" };

export default function PaginaRedefinirSenha() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Criar nova senha</h1>
        </CardTitle>
        <CardDescription>Escolha uma senha nova para sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioRedefinirSenha />
      </CardContent>
    </Card>
  );
}
