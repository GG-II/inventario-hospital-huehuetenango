import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstadisticasData {
  totalEquipos: number;
  equiposPorEstado: Array<{
    estado: string;
    color: string;
    cantidad: number;
  }>;
  ultimosTraslados: Array<{
    id: number;
    folio: string;
    equipo: string;
    descripcion: string;
    areaOrigen: string;
    areaDestino: string;
    fecha: string;
  }>;
  bajasPendientes: {
    cantidad: number;
    lista: Array<{
      id: number;
      equipo: string;
      descripcion: string;
      motivo: string;
      fecha: string;
    }>;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/dashboard/estadisticas', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEstadisticas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.nombre} · {user?.rol}
        </p>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Equipos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Equipos
            </CardTitle>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estadisticas?.totalEquipos || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Equipos registrados</p>
          </CardContent>
        </Card>

        {/* Equipos por Estado */}
        {estadisticas?.equiposPorEstado.slice(0, 3).map((estado) => (
          <Card key={estado.estado}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {estado.estado}
              </CardTitle>
              <Badge variant="outline" className={getEstadoBadgeColor(estado.color)}>
                {estado.cantidad}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estado.cantidad}</div>
              <p className="text-sm text-gray-500 mt-1">
                {((estado.cantidad / (estadisticas?.totalEquipos || 1)) * 100).toFixed(1)}%
                del total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Últimos Traslados y Bajas Pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Traslados */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimos Traslados</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/traslados">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {estadisticas?.ultimosTraslados.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay traslados recientes</p>
            ) : (
              <div className="space-y-4">
                {estadisticas?.ultimosTraslados.map((traslado) => (
                  <div key={traslado.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{traslado.folio}</p>
                      <p className="text-sm text-gray-600 truncate">{traslado.equipo}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {traslado.areaOrigen} → {traslado.areaDestino}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(traslado.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bajas Pendientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Bajas Pendientes
                {estadisticas && estadisticas.bajasPendientes.cantidad > 0 && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                    {estadisticas.bajasPendientes.cantidad}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/bajas">Ver todas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {estadisticas?.bajasPendientes.cantidad === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay bajas pendientes de aprobación
              </p>
            ) : (
              <div className="space-y-4">
                {estadisticas?.bajasPendientes.lista.map((baja) => (
                  <div key={baja.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{baja.equipo}</p>
                      <p className="text-sm text-gray-600 truncate">{baja.descripcion}</p>
                      <Badge variant="outline" className="mt-1 text-xs bg-red-100 text-red-800">
                        {baja.motivo}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(baja.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col" asChild>
              <Link to="/equipos/nuevo">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Equipo
              </Link>
            </Button>

            <Button variant="outline" className="h-24 flex flex-col" asChild>
              <Link to="/traslados/nuevo">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Nuevo Traslado
              </Link>
            </Button>

            <Button variant="outline" className="h-24 flex flex-col" asChild>
              <Link to="/bajas/nueva">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Solicitar Baja
              </Link>
            </Button>

            <Button variant="outline" className="h-24 flex flex-col" asChild>
              <Link to="/reportes">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reportes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}