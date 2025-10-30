import api from './api';
import { Equipo, CreateEquipoData, UpdateEquipoData, EquipoFilters } from '@/types/equipo';
import { PaginatedResponse, ApiResponse } from '@/types/common';

export const equipoService = {
  /**
   * Listar equipos con filtros y paginación
   */
  async listar(filtros?: EquipoFilters): Promise<PaginatedResponse<Equipo>> {
    const params = new URLSearchParams();
    
    if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
    if (filtros?.areaId) params.append('areaId', filtros.areaId.toString());
    if (filtros?.estadoId) params.append('estadoId', filtros.estadoId.toString());
    if (filtros?.subgrupoId) params.append('subgrupoId', filtros.subgrupoId.toString());
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await api.get<PaginatedResponse<Equipo>>(
      `/equipos?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * Obtener equipo por ID
   */
  async obtenerPorId(id: number): Promise<Equipo> {
    const response = await api.get<ApiResponse<Equipo>>(`/equipos/${id}`);
    return response.data.data;
  },

  /**
   * Crear nuevo equipo
   */
  async crear(data: CreateEquipoData): Promise<Equipo> {
    const response = await api.post<ApiResponse<Equipo>>('/equipos', data);
    return response.data.data;
  },

  /**
   * Actualizar equipo
   */
  async actualizar(id: number, data: UpdateEquipoData): Promise<Equipo> {
    const response = await api.put<ApiResponse<Equipo>>(`/equipos/${id}`, data);
    return response.data.data;
  },

  /**
   * Obtener historial de un equipo
   */
  async obtenerHistorial(id: number): Promise<any> {
    const response = await api.get(`/equipos/${id}/historial`);
    return response.data.data;
  },
};