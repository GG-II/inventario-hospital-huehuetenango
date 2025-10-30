import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bajaService } from '@/services/bajaService';
import { Baja, EstadoBaja, MotivoBaja } from '@/types/baja';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BajasList() {
  const { user } = useAuth();
  const [bajas, setBajas] = useState<Baja[]>([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState<EstadoBaja | 'TODOS'>('TODOS');
  const [motivo, setMotivo] = useState<MotivoBaja | 'TODOS'>('TODOS');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const canCreate =
    user?.rol === 'Admin' ||
    user?.rol === 'Inventarios' ||
    user?.rol === 'Mantenimiento';

  useEffect(() => {
    cargarBajas();
  }, [page, estado, motivo]);

  const cargarBajas = async () => {
    try {
      setLoading(true);
      const response = await bajaService.listar({
        estado: estado,
        motivo: motivo,
        page,
        limit: 20,
      });

      setBajas(response.data);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Error al cargar bajas:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setEstado('TODOS');
    setMotivo('TODOS');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const getEstadoBadge = (estado: EstadoBaja) => {
    const badges = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APROBADO: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADO: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMotivoBadge = (motivo: MotivoBaja) => {
    const badges = {
      IRREPARABLE: 'bg-red-100 text-red-800 border-red-200',
      OBSOLETO: 'bg-orange-100 text-orange-800 border-orange-200',
      PERDIDA_TOTAL: 'bg-purple-100 text-purple-800 border-purple-200',
      ROBO: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return badges[motivo] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMotivoLabel = (motivo: MotivoBaja) => {
    const labels = {
      IRREPARABLE: 'Irreparable',
      OBSOLETO: 'Obsoleto',
      PERDIDA_TOTAL: 'Pérdida Total',
      ROBO: 'Robo',
    };
    return labels[motivo];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Bajas de Equipos</h1>
          <p className="text-gray-600 mt-1">
            Gestión de solicitudes de baja de equipos
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/bajas/nueva">
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
              Solicitar Baja
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
            {/* Estado */}
            <Select
              value={estado}
              onValueChange={(value: EstadoBaja | 'TODOS') => {
                setEstado(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="APROBADO">Aprobado</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            {/* Motivo */}
            <Select
              value={motivo}
              onValueChange={(value: MotivoBaja | 'TODOS') => {
                setMotivo(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los motivos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los motivos</SelectItem>
                <SelectItem value="IRREPARABLE">Irreparable</SelectItem>
                <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
                <SelectItem value="PERDIDA_TOTAL">Pérdida Total</SelectItem>
                <SelectItem value="ROBO">Robo</SelectItem>
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
                <p className="mt-4 text-gray-600">Cargando bajas...</p>
              </div>
            </div>
          ) : bajas.length === 0 ? (
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <p className="text-lg font-medium">No se encontraron bajas</p>
              <p className="text-sm mt-1">
                Intenta ajustar los filtros o solicita una nueva baja
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bajas.map((baja) => (
                    <TableRow key={baja.id}>
                      <TableCell>
                        <div className="font-medium">
                          {baja.equipo?.codigoSICOIN}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {baja.equipo?.descripcion}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getMotivoBadge(baja.motivo)}
                        >
                          {getMotivoLabel(baja.motivo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getEstadoBadge(baja.estado)}
                        >
                          {baja.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{baja.solicitante?.nombre || '-'}</TableCell>
                      <TableCell>{formatDate(baja.fechaCreacion)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/bajas/${baja.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {bajas.length} de {total} bajas
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