export interface Area {
  id: number;
  nombre: string;
  jefe: string | null;
}

export interface Estado {
  id: number;
  nombre: string;
  color: string;
}

export interface Subgrupo {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
}

export interface Equipo {
  id: number;
  codigoSICOIN: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  precioUnitario: number;
  numeroFactura: string | null;
  fechaIngreso: string;
  observaciones: string | null;
  areaId: number;
  estadoId: number;
  subgrupoId: number;
  proveedorId: number | null;
  createdAt: string;
  updatedAt: string;
  area?: Area;
  estado?: Estado;
  subgrupo?: Subgrupo;
  proveedor?: Proveedor;
}

export interface CreateEquipoData {
  codigoSICOIN: string;
  descripcion: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  precioUnitario: number;
  numeroFactura?: string;
  fechaIngreso: string;
  areaId: number;
  estadoId: number;
  subgrupoId: number;
  proveedorId?: number;
  observaciones?: string;
}

export interface UpdateEquipoData {
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  precioUnitario?: number;
  numeroFactura?: string;
  fechaIngreso?: string;
  areaId?: number;
  estadoId?: number;
  subgrupoId?: number;
  proveedorId?: number;
  observaciones?: string;
}

export interface EquipoFilters {
  busqueda?: string;
  areaId?: number;
  estadoId?: number;
  subgrupoId?: number;
  page?: number;
  limit?: number;
}