import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trasladoService } from '@/services/trasladoService';
import { catalogoService } from '@/services/catalogoService';
import { Traslado, Area } from '@/types/traslado';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TrasladosList() {
  const { user } = useAuth();
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaOrigenId, setAreaOrigenId] = useState<string>('todos');
  const [areaDestinoId, setAreaDestinoId] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [areas, setAreas] = useState<Area[]>([]);

  const canCreate = user?.rol === 'Admin' || user?.rol === 'Inventarios';

  useEffect(() => {
    cargarAreas();
  }, []);

  useEffect(() => {
    cargarTraslados();
  }, [page, areaOrigenId, areaDestinoId]);

  const cargarAreas = async () => {
    try {
      const areasData = await catalogoService.obtenerAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const cargarTraslados = async () => {
    try {
      setLoading(true);
      const response = await trasladoService.listar({
        areaOrigenId: areaOrigenId !== 'todos' ? parseInt(areaOrigenId) : undefined,
        areaDestinoId: areaDestinoId !== 'todos' ? parseInt(areaDestinoId) : undefined,
        page,
        limit: 20,
      });

      setTraslados(response.data);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error al cargar traslados:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setAreaOrigenId('todos');
    setAreaDestinoId('todos');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Traslados</h1>
          <p className="text-gray-600 mt-1">
            Gestión de traslados de equipos entre áreas
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/traslados/nuevo">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Traslado
            </Link>
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Área Origen */}
            <Select value={areaOrigenId} onValueChange={(value) => {
              setAreaOrigenId(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Área de origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas (origen)</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Área Destino */}
            <Select value={areaDestinoId} onValueChange={(value) => {
              setAreaDestinoId(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Área de destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas (destino)</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón Limpiar */}
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando traslados...</p>
              </div>
            </div>
          ) : traslados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <p className="text-lg font-medium">No se encontraron traslados</p>
              <p className="text-sm mt-1">
                Intenta ajustar los filtros o crea un nuevo traslado
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folio</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Hacia</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traslados.map((traslado) => (
                    <TableRow key={traslado.id}>
                      <TableCell className="font-medium">
                        {traslado.folioConocimiento}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {traslado.equipo?.codigoSICOIN}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {traslado.equipo?.descripcion}
                        </div>
                      </TableCell>
                      <TableCell>{traslado.areaOrigen?.nombre || '-'}</TableCell>
                      <TableCell>{traslado.areaDestino?.nombre || '-'}</TableCell>
                      <TableCell>{formatDate(traslado.fechaMovimiento)}</TableCell>
                      <TableCell>{traslado.usuario?.nombre || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/traslados/${traslado.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {traslados.length} de {total} traslados
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-gray-600">
                      Página {page} de {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}