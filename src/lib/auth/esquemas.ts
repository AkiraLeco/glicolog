import { z } from "zod";

export const SENHA_MINIMO = 8;
// O Supabase (bcrypt) só considera os primeiros 72 bytes da senha.
const SENHA_MAXIMO = 72;

const email = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .pipe(z.email("E-mail inválido."));

const novaSenha = z
  .string({ error: "Informe uma senha." })
  .min(SENHA_MINIMO, `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
  .max(SENHA_MAXIMO, `A senha pode ter no máximo ${SENHA_MAXIMO} caracteres.`);

const confirmacao = z.string({ error: "Repita a senha." });

const senhasIguais = {
  check: (dados: { senha: string; confirmacao: string }) => dados.senha === dados.confirmacao,
  params: { message: "As senhas não são iguais.", path: ["confirmacao"] },
};

export const esquemaEntrar = z.object({
  email,
  senha: z.string({ error: "Informe sua senha." }).min(1, "Informe sua senha."),
});

export const esquemaCadastro = z
  .object({ email, senha: novaSenha, confirmacao })
  .refine(senhasIguais.check, senhasIguais.params);

export const esquemaRecuperarSenha = z.object({ email });

export const esquemaRedefinirSenha = z
  .object({ senha: novaSenha, confirmacao })
  .refine(senhasIguais.check, senhasIguais.params);
