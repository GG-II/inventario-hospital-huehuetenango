import { useState, useEffect } from 'react';
import { areaService } from '@/services/areaService';
import { Area } from '@/types/area';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AreasList() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario
  const [nombre, setNombre] = useState('');
  const [jefe, setJefe] = useState('');

  const canEdit = user?.rol === 'Admin' || user?.rol === 'Inventarios';

  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    try {
      setLoading(true);
      const data = await areaService.listar();
      setAreas(data);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      setError('Error al cargar las áreas');
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogo = (area: Area) => {
    setAreaSeleccionada(area);
    setNombre(area.nombre);
    setJefe(area.jefe || '');
    setError('');
    setSuccess('');
    setShowDialog(true);
  };

  const cerrarDialogo = () => {
    setShowDialog(false);
    setAreaSeleccionada(null);
    setNombre('');
    setJefe('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaSeleccionada) return;

    setError('');
    setSuccess('');

    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    setSaving(true);

    try {
      await areaService.actualizar(areaSeleccionada.id, {
        nombre: nombre.trim(),
        jefe: jefe.trim() || undefined,
      });

      setSuccess('Área actualizada exitosamente');

      // Recargar áreas
      setTimeout(() => {
        cargarAreas();
        cerrarDialogo();
      }, 1000);
    } catch (err: any) {
      console.error('Error al actualizar área:', err);
      setError(
        err.response?.data?.error?.message || 'Error al actualizar el área'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Áreas del Hospital</h1>
        <p className="text-gray-600 mt-1">
          Gestión de áreas y jefes responsables
        </p>
      </div>

      {/* Mensajes globales */}
      {error && !showDialog && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Áreas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando áreas...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead>Jefe Responsable</TableHead>
                  <TableHead className="text-center">Equipos Asignados</TableHead>
                  {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.nombre}</TableCell>
                    <TableCell>
                      {area.jefe || (
                        <span className="text-gray-400 italic">Por asignar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {area.cantidadEquipos || 0}
                      </span>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDialogo(area)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
            <DialogDescription>
              Actualiza la información del área y su jefe responsable
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Nombre del Área */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Área <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Emergencia"
                  required
                  disabled={saving}
                  minLength={3}
                />
              </div>

              {/* Jefe Responsable */}
              <div className="space-y-2">
                <Label htmlFor="jefe">Jefe Responsable</Label>
                <Input
                  id="jefe"
                  value={jefe}
                  onChange={(e) => setJefe(e.target.value)}
                  placeholder="Ej: Dr. Juan Pérez"
                  disabled={saving}
                />
                <p className="text-sm text-gray-500">
                  Opcional. Deja vacío si aún no hay jefe asignado.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={cerrarDialogo}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </div>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}