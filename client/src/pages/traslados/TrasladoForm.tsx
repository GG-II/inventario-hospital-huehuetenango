import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trasladoService } from '@/services/trasladoService';
import { equipoService } from '@/services/equipoService';
import { catalogoService } from '@/services/catalogoService';
import { Equipo, Area } from '@/types/equipo';
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

export default function TrasladoForm() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: Seleccionar equipo, 2: Confirmar traslado
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

  // Áreas
  const [areas, setAreas] = useState<Area[]>([]);

  // Formulario
  const [areaDestinoId, setAreaDestinoId] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarEquipos();
    cargarAreas();
  }, []);

  useEffect(() => {
    // Filtrar equipos según búsqueda
    if (busqueda.trim() === '') {
      setEquiposFiltrados(equipos);
    } else {
      const filtrados = equipos.filter((equipo) =>
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
        estadoId: 1, // Solo equipos activos
        limit: 100,
      });
      setEquipos(response.data);
      setEquiposFiltrados(response.data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar la lista de equipos');
    } finally {
      setLoadingEquipos(false);
    }
  };

  const cargarAreas = async () => {
    try {
      const areasData = await catalogoService.obtenerAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
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

    if (areaDestinoId === 0) {
      setError('Debes seleccionar un área de destino');
      return;
    }

    if (equipoSeleccionado.area?.id === areaDestinoId) {
      setError('El equipo ya se encuentra en esa área');
      return;
    }

    setLoading(true);

    try {
      await trasladoService.crear({
        equipoId: equipoSeleccionado.id,
        areaDestinoId,
        observaciones: observaciones || undefined,
      });

      setSuccess('Traslado registrado exitosamente');

      setTimeout(() => {
        navigate('/traslados');
      }, 1500);
    } catch (err: any) {
      console.error('Error al crear traslado:', err);
      setError(err.response?.data?.error?.message || 'Error al registrar el traslado');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Nuevo Traslado</h1>
          <p className="text-gray-600 mt-1">
            {paso === 1
              ? 'Selecciona el equipo a trasladar'
              : 'Confirma los detalles del traslado'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/traslados')}>
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
                <p>No se encontraron equipos activos</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código SICOIN</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Área Actual</TableHead>
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

      {/* PASO 2: Confirmar Traslado */}
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
                    <p className="text-sm text-gray-600">Estado</p>
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
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm font-medium text-blue-900">Área Actual</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {equipoSeleccionado.area?.nombre}
                    </p>
                    {equipoSeleccionado.area?.jefe && (
                      <p className="text-sm text-blue-700">
                        Responsable: {equipoSeleccionado.area.jefe}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPaso(1);
                      setEquipoSeleccionado(null);
                      setAreaDestinoId(0);
                      setObservaciones('');
                    }}
                  >
                    Cambiar Equipo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de Traslado */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Traslado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Área de Destino */}
                <div className="space-y-2">
                  <Label htmlFor="areaDestinoId">
                    Área de Destino <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={areaDestinoId.toString()}
                    onValueChange={(value) => setAreaDestinoId(parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el área de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecciona un área
                      </SelectItem>
                      {areas.map((area) => (
                        <SelectItem
                          key={area.id}
                          value={area.id.toString()}
                          disabled={equipoSeleccionado.area?.id === area.id}
                        >
                          {area.nombre}
                          {equipoSeleccionado.area?.id === area.id &&
                            ' (Área actual - no disponible)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Motivo del traslado u observaciones adicionales..."
                    disabled={loading}
                    rows={4}
                  />
                </div>

                {/* Nota */}
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="font-medium mb-2">📋 Al confirmar el traslado:</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Se generará automáticamente un folio de conocimiento</li>
                    <li>
                      La ubicación del equipo se actualizará al área de destino
                    </li>
                    <li>
                      El movimiento quedará registrado en el historial del equipo
                    </li>
                  </ul>
                </div>

                {/* Botones */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/traslados')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading || areaDestinoId === 0}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Registrando Traslado...
                      </div>
                    ) : (
                      'Registrar Traslado'
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