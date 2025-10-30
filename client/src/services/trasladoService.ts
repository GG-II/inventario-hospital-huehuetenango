import api from './api';
import { Traslado, CreateTrasladoData, TrasladoFilters } from '@/types/traslado';
import { PaginatedResponse, ApiResponse } from '@/types/common';

export const trasladoService = {
  /**
   * Listar traslados con filtros y paginación
   */
  async listar(filtros?: TrasladoFilters): Promise<PaginatedResponse<Traslado>> {
    const params = new URLSearchParams();
    
    if (filtros?.equipoId) params.append('equipoId', filtros.equipoId.toString());
    if (filtros?.areaOrigenId) params.append('areaOrigenId', filtros.areaOrigenId.toString());
    if (filtros?.areaDestinoId) params.append('areaDestinoId', filtros.areaDestinoId.toString());
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await api.get<PaginatedResponse<Traslado>>(
      `/traslados?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * Obtener traslado por ID
   */
  async obtenerPorId(id: number): Promise<Traslado> {
    const response = await api.get<ApiResponse<Traslado>>(`/traslados/${id}`);
    return response.data.data;
  },

  /**
   * Crear nuevo traslado
   */
  async crear(data: CreateTrasladoData): Promise<Traslado> {
    const response = await api.post<ApiResponse<Traslado>>('/traslados', data);
    return response.data.data;
  },
};