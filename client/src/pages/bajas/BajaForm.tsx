import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bajaService } from '@/services/bajaService';
import { equipoService } from '@/services/equipoService';
import { Equipo } from '@/types/equipo';
import { MotivoBaja } from '@/types/baja';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function BajaForm() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: Seleccionar equipo, 2: Confirmar baja
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lista de equipos
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([]);

  // Equipo seleccionado
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null);

  // Formulario
  const [motivo, setMotivo] = useState<MotivoBaja>('IRREPARABLE');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarEquipos();
  }, []);

  useEffect(() => {
    // Filtrar equipos según búsqueda
    if (busqueda.trim() === '') {
      setEquiposFiltrados(equipos);
    } else {
      const filtrados = equipos.filter(
        (equipo) =>
          equipo.codigoSICOIN.toLowerCase().includes(busqueda.toLowerCase()) ||
          equipo.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
          equipo.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
          equipo.modelo?.toLowerCase().includes(busqueda.toLowerCase())
      );
      setEquiposFiltrados(filtrados);
    }
  }, [busqueda, equipos]);

  const cargarEquipos = async () => {
    try {
      setLoadingEquipos(true);
      const response = await equipoService.listar({
        limit: 100,
      });
      // Filtrar equipos que NO estén ya dados de baja
      const equiposDisponibles = response.data.filter(
        (equipo) => equipo.estado?.id !== 6 // 6 = Dado de baja
      );
      setEquipos(equiposDisponibles);
      setEquiposFiltrados(equiposDisponibles);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar la lista de equipos');
    } finally {
      setLoadingEquipos(false);
    }
  };

  const seleccionarEquipo = (equipo: Equipo) => {
    setEquipoSeleccionado(equipo);
    setPaso(2);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!equipoSeleccionado) {
      setError('Debes seleccionar un equipo');
      return;
    }

    if (!observaciones.trim()) {
      setError('Debes proporcionar observaciones que justifiquen la baja');
      return;
    }

    if (observaciones.trim().length < 20) {
      setError('Las observaciones deben tener al menos 20 caracteres');
      return;
    }

    setLoading(true);

    try {
      await bajaService.crear({
        equipoId: equipoSeleccionado.id,
        motivo,
        observaciones,
      });

      setSuccess('Solicitud de baja registrada exitosamente');

      setTimeout(() => {
        navigate('/bajas');
      }, 1500);
    } catch (err: any) {
      console.error('Error al solicitar baja:', err);
      setError(
        err.response?.data?.error?.message || 'Error al solicitar la baja'
      );
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

  const getMotivoDescripcion = (motivo: MotivoBaja) => {
    const descripciones = {
      IRREPARABLE:
        'El equipo presenta daños que no pueden ser reparados económicamente',
      OBSOLETO: 'El equipo está obsoleto y ya no cumple con las necesidades actuales',
      PERDIDA_TOTAL: 'El equipo sufrió daños totales o se perdió completamente',
      ROBO: 'El equipo fue robado y no puede ser recuperado',
    };
    return descripciones[motivo];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Solicitar Baja de Equipo
          </h1>
          <p className="text-gray-600 mt-1">
            {paso === 1
              ? 'Selecciona el equipo que deseas dar de baja'
              : 'Confirma los detalles de la solicitud'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/bajas')}>
          Cancelar
        </Button>
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

      {/* PASO 1: Seleccionar Equipo */}
      {paso === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Selecciona el Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Búsqueda */}
            <div className="mb-4">
              <Input
                placeholder="Buscar por código, descripción, marca o modelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* Tabla de Equipos */}
            {loadingEquipos ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando equipos...</p>
                </div>
              </div>
            ) : equiposFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No se encontraron equipos disponibles</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código SICOIN</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposFiltrados.slice(0, 20).map((equipo) => (
                      <TableRow key={equipo.id}>
                        <TableCell className="font-medium">
                          {equipo.codigoSICOIN}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {equipo.descripcion}
                          </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => seleccionarEquipo(equipo)}
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {equiposFiltrados.length > 20 && (
              <p className="text-sm text-gray-500 mt-2">
                Mostrando 20 de {equiposFiltrados.length} equipos. Usa la búsqueda
                para encontrar equipos específicos.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* PASO 2: Confirmar Baja */}
      {paso === 2 && equipoSeleccionado && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información del Equipo */}
            <Card>
              <CardHeader>
                <CardTitle>Equipo Seleccionado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Código SICOIN</p>
                    <p className="font-medium text-lg">
                      {equipoSeleccionado.codigoSICOIN}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado Actual</p>
                    {equipoSeleccionado.estado && (
                      <Badge
                        variant="outline"
                        className={`${getEstadoBadgeColor(
                          equipoSeleccionado.estado.color
                        )} mt-1`}
                      >
                        {equipoSeleccionado.estado.nombre}
                      </Badge>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium">{equipoSeleccionado.descripcion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Marca</p>
                    <p className="font-medium">{equipoSeleccionado.marca || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-medium">{equipoSeleccionado.modelo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Área Actual</p>
                    <p className="font-medium">
                      {equipoSeleccionado.area?.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Serie</p>
                    <p className="font-medium">
                      {equipoSeleccionado.numeroSerie || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPaso(1);
                      setEquipoSeleccionado(null);
                      setMotivo('IRREPARABLE');
                      setObservaciones('');
                    }}
                  >
                    Cambiar Equipo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de Baja */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Baja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Motivo */}
                <div className="space-y-2">
                  <Label htmlFor="motivo">
                    Motivo de la Baja <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={motivo}
                    onValueChange={(value: MotivoBaja) => setMotivo(value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IRREPARABLE">Irreparable</SelectItem>
                      <SelectItem value="OBSOLETO">Obsoleto</SelectItem>
                      <SelectItem value="PERDIDA_TOTAL">Pérdida Total</SelectItem>
                      <SelectItem value="ROBO">Robo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    {getMotivoDescripcion(motivo)}
                  </p>
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observaciones">
                    Observaciones / Justificación{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Describe detalladamente el motivo de la baja. Mínimo 20 caracteres."
                    disabled={loading}
                    rows={6}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    {observaciones.length} / 20 caracteres mínimos
                  </p>
                </div>

                {/* Nota Importante */}
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-2">
                    ⚠️ Nota Importante
                  </h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>
                      Esta solicitud debe ser aprobada por Administrador o Jefe de
                      Inventarios
                    </li>
                    <li>
                      El equipo pasará a estado "De baja (pendiente)" hasta que sea
                      aprobado
                    </li>
                    <li>
                      Si es rechazada, el equipo volverá a su estado anterior
                    </li>
                    <li>
                      Una vez aprobada, el equipo pasará a "Dado de baja" de forma
                      permanente
                    </li>
                  </ul>
                </div>

                {/* Botones */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/bajas')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || observaciones.trim().length < 20}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando Solicitud...
                      </div>
                    ) : (
                      'Solicitar Baja'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}