import { z } from 'zod';

/** Mesmas regras da API (RegisterRequest), checadas antes de enviar. */
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe sua senha'),
});

const emailField = z.string().trim().min(1, 'Informe seu e-mail').email('E-mail inválido');

/** Mesma regra de senha do cadastro e da troca de senha. */
const passwordField = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[a-z]/, 'Inclua uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/\d/, 'Inclua um número');

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Informe seu nome').max(100, 'Nome muito longo'),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Repita a senha'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não são iguais' });

export const forgotSchema = z.object({ email: emailField });

export const codeSchema = z.string().regex(/^\d{6}$/, 'O código tem 6 números');

export const resetSchema = z
  .object({
    code: codeSchema,
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Repita a senha'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não são iguais' });

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3;
}

/** Transforma erros do zod em { campo: mensagem } (primeira mensagem de cada campo). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
