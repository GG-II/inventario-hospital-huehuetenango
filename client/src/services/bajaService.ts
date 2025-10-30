import api from './api';
import { Baja, CreateBajaData, ProcesarBajaData, BajaFilters } from '@/types/baja';
import { PaginatedResponse, ApiResponse } from '@/types/common';

export const bajaService = {
  /**
   * Listar bajas con filtros y paginación
   */
  async listar(filtros?: BajaFilters): Promise<PaginatedResponse<Baja>> {
    const params = new URLSearchParams();
    
    if (filtros?.equipoId) params.append('equipoId', filtros.equipoId.toString());
    if (filtros?.estado && filtros.estado !== 'TODOS') {
      params.append('estado', filtros.estado);
    }
    if (filtros?.motivo && filtros.motivo !== 'TODOS') {
      params.append('motivo', filtros.motivo);
    }
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await api.get<PaginatedResponse<Baja>>(
      `/bajas?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * Obtener baja por ID
   */
  async obtenerPorId(id: number): Promise<Baja> {
    const response = await api.get<ApiResponse<Baja>>(`/bajas/${id}`);
    return response.data.data;
  },

  /**
   * Solicitar baja de equipo
   */
  async crear(data: CreateBajaData): Promise<Baja> {
    const response = await api.post<ApiResponse<Baja>>('/bajas', data);
    return response.data.data;
  },

  /**
   * Procesar baja (aprobar o rechazar)
   */
  async procesar(id: number, data: ProcesarBajaData): Promise<Baja> {
    const response = await api.put<ApiResponse<Baja>>(`/bajas/${id}/procesar`, data);
    return response.data.data;
  },
};