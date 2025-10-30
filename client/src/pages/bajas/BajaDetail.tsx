import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bajaService } from '@/services/bajaService';
import { Baja } from '@/types/baja';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BajaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [baja, setBaja] = useState<Baja | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Diálogo de aprobación/rechazo
  const [showDialog, setShowDialog] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const canApprove =
    (user?.rol === 'Admin' || user?.rol === 'Inventarios') &&
    baja?.estado === 'PENDIENTE';

  useEffect(() => {
    if (id) {
      cargarBaja();
    }
  }, [id]);

  const cargarBaja = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await bajaService.obtenerPorId(parseInt(id));
      setBaja(data);
    } catch (error) {
      console.error('Error al cargar baja:', error);
      setError('Error al cargar la solicitud de baja');
    } finally {
      setLoading(false);
    }
  };

  const handleProcesar = async () => {
    if (!id) return;

    if (accion === 'rechazar' && !motivoRechazo.trim()) {
      setError('Debes proporcionar un motivo de rechazo');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await bajaService.procesar(parseInt(id), {
        aprobado: accion === 'aprobar',
        motivoRechazo: accion === 'rechazar' ? motivoRechazo : undefined,
      });

      setSuccess(
        accion === 'aprobar'
          ? 'Baja aprobada exitosamente'
          : 'Baja rechazada exitosamente'
      );

      setShowDialog(false);

      // Recargar datos
      setTimeout(() => {
        cargarBaja();
      }, 500);
    } catch (err: any) {
      console.error('Error al procesar baja:', err);
      setError(
        err.response?.data?.error?.message || 'Error al procesar la baja'
      );
      setShowDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", {
        locale: es,
      });
    } catch {
      return dateString;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APROBADO: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADO: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMotivoBadge = (motivo: string) => {
    const badges = {
      IRREPARABLE: 'bg-red-100 text-red-800 border-red-200',
      OBSOLETO: 'bg-orange-100 text-orange-800 border-orange-200',
      PERDIDA_TOTAL: 'bg-purple-100 text-purple-800 border-purple-200',
      ROBO: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return badges[motivo as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMotivoLabel = (motivo: string) => {
    const labels = {
      IRREPARABLE: 'Irreparable',
      OBSOLETO: 'Obsoleto',
      PERDIDA_TOTAL: 'Pérdida Total',
      ROBO: 'Robo',
    };
    return labels[motivo as keyof typeof labels];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!baja) {
    return (
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">Solicitud no encontrada</p>
        <Button className="mt-4" onClick={() => navigate('/bajas')}>
          Volver a Bajas
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
            <h1 className="text-3xl font-semibold text-gray-900">
              Solicitud de Baja #{baja.id}
            </h1>
            <Badge variant="outline" className={getEstadoBadge(baja.estado)}>
              {baja.estado}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Detalle de la solicitud de baja de equipo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/bajas')}>
            Volver
          </Button>
          {canApprove && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  setAccion('rechazar');
                  setShowDialog(true);
                }}
              >
                Rechazar
              </Button>
              <Button
                onClick={() => {
                  setAccion('aprobar');
                  setShowDialog(true);
                }}
              >
                Aprobar Baja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Información del Equipo */}
      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Código SICOIN</p>
              <p className="font-medium text-lg">{baja.equipo?.codigoSICOIN}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado del Equipo</p>
              <p className="font-medium">{baja.equipo?.estado?.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Descripción</p>
              <p className="font-medium">{baja.equipo?.descripcion}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Marca</p>
              <p className="font-medium">{baja.equipo?.marca || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Modelo</p>
              <p className="font-medium">{baja.equipo?.modelo || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Área</p>
              <p className="font-medium">{baja.equipo?.area?.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número de Serie</p>
              <p className="font-medium">{baja.equipo?.numeroSerie || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la Solicitud */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Solicitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Motivo de Baja</p>
              <Badge variant="outline" className={`${getMotivoBadge(baja.motivo)} mt-1`}>
                {getMotivoLabel(baja.motivo)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant="outline" className={`${getEstadoBadge(baja.estado)} mt-1`}>
                {baja.estado}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-600 mb-2">Observaciones / Justificación</p>
            <div className="bg-gray-50 p-4 rounded-md border">
              <p className="text-gray-700 whitespace-pre-wrap">{baja.observaciones}</p>
            </div>
          </div>

          {baja.motivoRechazo && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-2">Motivo de Rechazo</p>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <p className="text-red-800 whitespace-pre-wrap">{baja.motivoRechazo}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Solicitado por</p>
            <p className="font-medium">{baja.solicitante?.nombre || '-'}</p>
            <p className="text-sm text-gray-500">{formatDate(baja.fechaCreacion)}</p>
          </div>

          {baja.fechaAprobacion && baja.aprobador && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">
                  {baja.estado === 'APROBADO' ? 'Aprobado por' : 'Rechazado por'}
                </p>
                <p className="font-medium">{baja.aprobador.nombre}</p>
                <p className="text-sm text-gray-500">{formatDate(baja.fechaAprobacion)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmación */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accion === 'aprobar' ? 'Aprobar Baja' : 'Rechazar Baja'}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar'
                ? '¿Estás seguro de aprobar esta solicitud de baja? El equipo pasará a estado "Dado de baja" de forma permanente.'
                : 'Proporciona un motivo para el rechazo de esta solicitud.'}
            </DialogDescription>
          </DialogHeader>

          {accion === 'rechazar' && (
            <div className="space-y-2 py-4">
              <Label htmlFor="motivoRechazo">
                Motivo de Rechazo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explica por qué se rechaza esta solicitud..."
                rows={4}
                disabled={processing}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcesar}
              disabled={
                processing ||
                (accion === 'rechazar' && !motivoRechazo.trim())
              }
              variant={accion === 'rechazar' ? 'destructive' : 'default'}
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </div>
              ) : accion === 'aprobar' ? (
                'Confirmar Aprobación'
              ) : (
                'Confirmar Rechazo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}