import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { equipoService } from '@/services/equipoService';
import { Equipo } from '@/types/equipo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EquipoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [historial, setHistorial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const canEdit = user?.rol === 'Admin' || user?.rol === 'Inventarios';

  useEffect(() => {
    if (id) {
      cargarEquipo();
    }
  }, [id]);

  const cargarEquipo = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await equipoService.obtenerPorId(parseInt(id));
      setEquipo(data);
    } catch (error) {
      console.error('Error al cargar equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    if (!id || historial) return;

    try {
      setLoadingHistorial(true);
      const data = await equipoService.obtenerHistorial(parseInt(id));
      setHistorial(data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoadingHistorial(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">Equipo no encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/equipos')}>
          Volver a Equipos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-gray-900">{equipo.codigoSICOIN}</h1>
            {equipo.estado && (
              <Badge variant="outline" className={getEstadoBadgeColor(equipo.estado.color)}>
                {equipo.estado.nombre}
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">{equipo.descripcion}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/equipos')}>
            Volver
          </Button>
          {canEdit && (
            <Button asChild>
              <Link to={`/equipos/${equipo.id}/editar`}>
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacion" onValueChange={(value) => {
        if (value === 'historial') {
          cargarHistorial();
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* Tab: Información */}
        <TabsContent value="informacion" className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Código SICOIN</p>
                  <p className="font-medium text-lg">{equipo.codigoSICOIN}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subgrupo</p>
                  <p className="font-medium">
                    {equipo.subgrupo?.codigo} - {equipo.subgrupo?.nombre}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="font-medium">{equipo.descripcion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Especificaciones Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle>Especificaciones Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Marca</p>
                  <p className="font-medium">{equipo.marca || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Modelo</p>
                  <p className="font-medium">{equipo.modelo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Serie</p>
                  <p className="font-medium">{equipo.numeroSerie || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle>Información Financiera</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Precio Unitario</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(equipo.precioUnitario)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Número de Factura</p>
                  <p className="font-medium">{equipo.numeroFactura || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="font-medium">{equipo.proveedor?.nombre || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación y Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Área Actual</p>
                  <p className="font-medium">{equipo.area?.nombre}</p>
                  {equipo.area?.jefe && (
                    <p className="text-sm text-gray-600 mt-1">
                      Responsable: {equipo.area.jefe}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  {equipo.estado && (
                    <Badge
                      variant="outline"
                      className={`${getEstadoBadgeColor(equipo.estado.color)} mt-1`}
                    >
                      {equipo.estado.nombre}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Ingreso</p>
                  <p className="font-medium">{formatDate(equipo.fechaIngreso)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {equipo.observaciones && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{equipo.observaciones}</p>
              </CardContent>
            </Card>
          )}

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Creado por</p>
                  <p className="font-medium">{(equipo as any).creadoPor?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de registro</p>
                  <p className="font-medium">
                    {equipo.createdAt && equipo.createdAt !== 'CURRENT_TIMESTAMP' && (
                        <div>
                            <p className="text-sm text-gray-600">Fecha de registro</p>
                            <p className="font-medium">{formatDate(equipo.createdAt)}</p>
                        </div>
                        )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistorial ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Cargando historial...</p>
                  </div>
                </div>
              ) : historial?.movimientos?.length > 0 ? (
                <div className="space-y-4">
                  {historial.movimientos.map((movimiento: any, index: number) => (
                    <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {movimiento.tipo === 'TRASLADO' ? 'Traslado' : movimiento.tipo}
                          </p>
                          <p className="text-sm text-gray-600">
                            De: {movimiento.areaOrigen?.nombre} → A:{' '}
                            {movimiento.areaDestino?.nombre}
                          </p>
                          {movimiento.folioConocimiento && (
                            <p className="text-sm text-gray-500">
                              Folio: {movimiento.folioConocimiento}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {movimiento.fechaMovimiento
                            ? formatDate(movimiento.fechaMovimiento)
                            : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay movimientos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}