import api from './api';
import { ApiResponse } from '@/types/common';

interface CambiarPasswordData {
  passwordActual: string;
  passwordNuevo: string;
  confirmarPassword: string;
}

export const usuarioService = {
  /**
   * Cambiar contraseña del usuario actual
   */
  async cambiarPassword(data: CambiarPasswordData): Promise<void> {
    await api.put<ApiResponse<void>>('/usuario/cambiar-password', data);
  },
};