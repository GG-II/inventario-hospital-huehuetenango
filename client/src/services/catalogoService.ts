import api from './api';
import { Area, Estado, Subgrupo, Proveedor } from '@/types/equipo';

export const catalogoService = {
  /**
   * Obtener todas las áreas
   */
  async obtenerAreas(): Promise<Area[]> {
    // Por ahora retornamos datos mock, luego crearemos endpoint en backend
    return [
      { id: 1, nombre: 'Dirección', jefe: 'Dr. Juan Pérez' },
      { id: 2, nombre: 'Emergencia', jefe: 'Dra. María López' },
      { id: 3, nombre: 'Hospitalización', jefe: 'Dr. Carlos Méndez' },
      { id: 4, nombre: 'Quirófano', jefe: 'Dr. Pedro Ramírez' },
      { id: 5, nombre: 'Consulta Externa', jefe: 'Dra. Ana García' },
      { id: 6, nombre: 'Laboratorio', jefe: 'Lic. Rosa Flores' },
      { id: 7, nombre: 'Radiología', jefe: 'Dr. Luis Hernández' },
      { id: 8, nombre: 'Farmacia', jefe: 'Q.F. Carmen Ruiz' },
      { id: 9, nombre: 'Mantenimiento', jefe: 'Ing. Jorge Castro' },
      { id: 10, nombre: 'Informática', jefe: 'Lic. Roberto Díaz' },
    ];
  },

  /**
   * Obtener todos los estados
   */
  async obtenerEstados(): Promise<Estado[]> {
    return [
      { id: 1, nombre: 'Activo', color: 'green' },
      { id: 2, nombre: 'En reparación', color: 'yellow' },
      { id: 3, nombre: 'Inactivo', color: 'gray' },
      { id: 4, nombre: 'En préstamo', color: 'blue' },
      { id: 5, nombre: 'De baja (pendiente)', color: 'orange' },
      { id: 6, nombre: 'Dado de baja', color: 'red' },
    ];
  },

  /**
   * Obtener todos los subgrupos
   */
  async obtenerSubgrupos(): Promise<Subgrupo[]> {
    return [
      { id: 1, codigo: '321', nombre: 'De producción' },
      { id: 2, codigo: '322', nombre: 'De oficina y Muebles' },
      { id: 3, codigo: '323', nombre: 'Médico, sanitario y laboratorio' },
      { id: 4, codigo: '324', nombre: 'Educacional, cultural y recreativo' },
      { id: 5, codigo: '325', nombre: 'Transporte, tracción y elevación' },
      { id: 6, codigo: '326', nombre: 'De comunicaciones' },
      { id: 7, codigo: '328', nombre: 'De cómputo' },
      { id: 8, codigo: '329', nombre: 'Otros activos' },
    ];
  },

  /**
   * Obtener todos los proveedores
   */
  async obtenerProveedores(): Promise<Proveedor[]> {
    return [
      { id: 1, nombre: 'Proveedor A', contacto: 'Juan Pérez', telefono: '12345678', email: 'contacto@proveedora.com' },
      { id: 2, nombre: 'Proveedor B', contacto: 'María López', telefono: '87654321', email: 'info@proveedorb.com' },
      { id: 3, nombre: 'Proveedor C', contacto: null, telefono: null, email: null },
    ];
  },
};