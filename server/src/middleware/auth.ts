import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import type { JwtPayload } from '../utils/jwt';

/**
 * Extender FastifyRequest para incluir user
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Middleware para verificar autenticación
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // 1. Extraer token del header Authorization
    const token = extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token no proporcionado',
        },
      });
    }

    // 2. Verificar y decodificar token
    const decoded = verifyToken(token);

    // 3. Adjuntar usuario al request
    request.user = decoded;

  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido o expirado',
      },
    });
  }
}

/**
 * Middleware para verificar rol específico
 */
export function requireRole(rolesPermitidos: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No autenticado',
        },
      });
    }

    const { rolNombre } = request.user;

    // Admin tiene acceso a todo
    if (rolNombre === 'Admin') {
      return;
    }

    if (!rolesPermitidos.includes(rolNombre)) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para esta acción',
        },
      });
    }
  };
}