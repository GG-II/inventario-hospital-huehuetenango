import { z } from 'zod';

/**
 * Schema para login
 */
export const loginSchema = z.object({
  username: z.string().min(3, 'Username debe tener al menos 3 caracteres'),
  password: z.string().min(8, 'Password debe tener al menos 8 caracteres'),
});

export type LoginDto = z.infer<typeof loginSchema>;

/**
 * Schema para respuesta de login
 */
export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    nombre: string;
    email: string | null;
    rol: string;
    area: string | null;
  };
}

/**
 * Schema para respuesta de error
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}