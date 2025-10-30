import { Area, Equipo } from './equipo';
import { User } from './auth';

export interface Traslado {
  id: number;
  tipo: 'TRASLADO';
  equipoId: number;
  areaOrigenId: number;
  areaDestinoId: number;
  folioConocimiento: string;
  observaciones: string | null;
  fechaMovimiento: string;
  usuarioId: number;
  equipo?: Equipo;
  areaOrigen?: Area;
  areaDestino?: Area;
  usuario?: User;
}

export interface CreateTrasladoData {
  equipoId: number;
  areaDestinoId: number;
  observaciones?: string;
}

export interface TrasladoFilters {
  equipoId?: number;
  areaOrigenId?: number;
  areaDestinoId?: number;
  page?: number;
  limit?: number;
}