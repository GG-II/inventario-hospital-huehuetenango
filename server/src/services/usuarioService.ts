import { db } from '../config/database';
import { usuarios } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export class UsuarioService {
  /**
   * Cambiar contraseña del usuario
   */
  async cambiarPassword(
    usuarioId: number,
    passwordActual: string,
    passwordNuevo: string
  ): Promise<void> {
    // Obtener usuario - SOLO los campos que necesitamos
    const [usuario] = await db
      .select({
        id: usuarios.id,
        username: usuarios.username,
        password: usuarios.password,
        nombre: usuarios.nombre,
      })
      .from(usuarios)
      .where(eq(usuarios.id, usuarioId))
      .limit(1);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Validar nueva contraseña
    if (passwordNuevo.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(passwordNuevo, 10);

    // Actualizar contraseña y updatedAt
    await db
      .update(usuarios)
      .set({ 
        password: passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usuarios.id, usuarioId));
  }
}

export const usuarioService = new UsuarioService();