import { Equipo } from './equipo';
import { User } from './auth';

export type MotivoBaja = 'IRREPARABLE' | 'OBSOLETO' | 'PERDIDA_TOTAL' | 'ROBO';
export type EstadoBaja = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Baja {
  id: number;
  equipoId: number;
  motivo: MotivoBaja;
  estado: EstadoBaja;
  observaciones: string | null;
  motivoRechazo: string | null;
  creadoPor: number;
  aprobadoPor: number | null;
  fechaCreacion: string;
  fechaAprobacion: string | null;
  equipo?: Equipo;
  solicitante?: User;
  aprobador?: User;
}

export interface CreateBajaData {
  equipoId: number;
  motivo: MotivoBaja;
  observaciones: string;
}

export interface ProcesarBajaData {
  aprobado: boolean;
  motivoRechazo?: string;
}

export interface BajaFilters {
  equipoId?: number;
  estado?: EstadoBaja | 'TODOS';
  motivo?: MotivoBaja | 'TODOS';
  page?: number;
  limit?: number;
}