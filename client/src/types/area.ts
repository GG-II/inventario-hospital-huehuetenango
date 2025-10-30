export interface Area {
  id: number;
  nombre: string;
  jefe: string | null;
  cantidadEquipos?: number;
}

export interface UpdateAreaData {
  nombre: string;
  jefe?: string;
}