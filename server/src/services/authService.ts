import { db } from '../config/database';
import { usuarios, roles, areas } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import type { LoginDto, LoginResponse } from '../types/auth';

export class AuthService {
  /**
   * Autentica un usuario y genera un token JWT
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    // 1. Buscar usuario por username
    const [user] = await db
      .select({
        id: usuarios.id,
        username: usuarios.username,
        password: usuarios.password,
        nombre: usuarios.nombre,
        email: usuarios.email,
        activo: usuarios.activo,
        rolId: usuarios.rolId,
        areaId: usuarios.areaId,
      })
      .from(usuarios)
      .where(eq(usuarios.username, credentials.username))
      .limit(1);

    // 2. Verificar si el usuario existe
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // 3. Verificar si el usuario está activo
    if (!user.activo) {
      throw new Error('Usuario deshabilitado. Contacte al administrador');
    }

    // 4. Comparar contraseñas
    const passwordMatch = await comparePassword(
      credentials.password,
      user.password
    );

    if (!passwordMatch) {
      throw new Error('Credenciales inválidas');
    }

    // 5. Obtener información del rol
    const [userRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.rolId))
      .limit(1);

    if (!userRole) {
      throw new Error('Rol no encontrado');
    }

    // 6. Obtener información del área (si tiene)
    let areaName: string | null = null;
    if (user.areaId) {
      const [userArea] = await db
        .select()
        .from(areas)
        .where(eq(areas.id, user.areaId))
        .limit(1);
      
      if (userArea) {
        areaName = userArea.nombre;
      }
    }

    // 7. Generar token JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      rolId: user.rolId,
      rolNombre: userRole.nombre,
    });

    // 8. Retornar respuesta exitosa
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: userRole.nombre,
        area: areaName,
      },
    };
  }

  /**
   * Obtiene información del usuario actual por ID
   */
  async getCurrentUser(userId: number) {
    const [user] = await db
      .select({
        id: usuarios.id,
        username: usuarios.username,
        nombre: usuarios.nombre,
        email: usuarios.email,
        rolId: usuarios.rolId,
        areaId: usuarios.areaId,
      })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.id, userId),
          eq(usuarios.activo, true)
        )
      )
      .limit(1);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener rol
    const [userRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.rolId))
      .limit(1);

    // Obtener área
    let areaName: string | null = null;
    if (user.areaId) {
      const [userArea] = await db
        .select()
        .from(areas)
        .where(eq(areas.id, user.areaId))
        .limit(1);
      
      if (userArea) {
        areaName = userArea.nombre;
      }
    }

    return {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: userRole?.nombre || 'Sin rol',
      area: areaName,
    };
  }
}

export const authService = new AuthService();