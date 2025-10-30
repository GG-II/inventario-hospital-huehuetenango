import api from './api';
import { Area, UpdateAreaData } from '@/types/area';
import { ApiResponse } from '@/types/common';

export const areaService = {
  /**
   * Listar todas las áreas
   */
  async listar(): Promise<Area[]> {
    const response = await api.get<ApiResponse<Area[]>>('/areas');
    return response.data.data;
  },

  /**
   * Obtener área por ID
   */
  async obtenerPorId(id: number): Promise<Area> {
    const response = await api.get<ApiResponse<Area>>(`/areas/${id}`);
    return response.data.data;
  },

  /**
   * Actualizar área
   */
  async actualizar(id: number, data: UpdateAreaData): Promise<Area> {
    const response = await api.put<ApiResponse<Area>>(`/areas/${id}`, data);
    return response.data.data;
  },
};