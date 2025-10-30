import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { equipoService } from '@/services/equipoService';
import { catalogoService } from '@/services/catalogoService';
import { Equipo, Area, Estado, Subgrupo } from '@/types/equipo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';

export default function EquiposList() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [areaId, setAreaId] = useState<string>('todos');
  const [estadoId, setEstadoId] = useState<string>('todos');
  const [subgrupoId, setSubgrupoId] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Catálogos
  const [areas, setAreas] = useState<Area[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarEquipos();
  }, [page, busqueda, areaId, estadoId, subgrupoId]);

  const cargarCatalogos = async () => {
    try {
      const [areasData, estadosData, subgruposData] = await Promise.all([
        catalogoService.obtenerAreas(),
        catalogoService.obtenerEstados(),
        catalogoService.obtenerSubgrupos(),
      ]);

      setAreas(areasData);
      setEstados(estadosData);
      setSubgrupos(subgruposData);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const response = await equipoService.listar({
        busqueda: busqueda || undefined,
        areaId: areaId !== 'todos' ? parseInt(areaId) : undefined,
        estadoId: estadoId !== 'todos' ? parseInt(estadoId) : undefined,
        subgrupoId: subgrupoId !== 'todos' ? parseInt(subgrupoId) : undefined,
        page,
        limit: 20,
      });

      setEquipos(response.data);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setAreaId('todos');
    setEstadoId('todos');
    setSubgrupoId('todos');
    setPage(1);
  };

  const getEstadoBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Equipos</h1>
          <p className="text-gray-600 mt-1">
            Gestión de equipos médicos y mobiliario
          </p>
        </div>
        <Button asChild>
          <Link to="/equipos/nuevo">
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
            Nuevo Equipo
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por código, descripción, marca..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Área */}
            <Select value={areaId} onValueChange={(value) => {
              setAreaId(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estado */}
            <Select value={estadoId} onValueChange={(value) => {
              setEstadoId(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estados.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id.toString()}>
                    {estado.nombre}
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
                <p className="mt-4 text-gray-600">Cargando equipos...</p>
              </div>
            </div>
          ) : equipos.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-lg font-medium">No se encontraron equipos</p>
              <p className="text-sm mt-1">
                Intenta ajustar los filtros o crea un nuevo equipo
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código SICOIN</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipos.map((equipo) => (
                    <TableRow key={equipo.id}>
                      <TableCell className="font-medium">
                        {equipo.codigoSICOIN}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{equipo.descripcion}</div>
                      </TableCell>
                      <TableCell>
                        {equipo.marca && equipo.modelo
                          ? `${equipo.marca} ${equipo.modelo}`
                          : equipo.marca || equipo.modelo || '-'}
                      </TableCell>
                      <TableCell>{equipo.area?.nombre || '-'}</TableCell>
                      <TableCell>
                        {equipo.estado && (
                          <Badge
                            variant="outline"
                            className={getEstadoBadgeColor(equipo.estado.color)}
                          >
                            {equipo.estado.nombre}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(equipo.precioUnitario)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/equipos/${equipo.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {equipos.length} de {total} equipos
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