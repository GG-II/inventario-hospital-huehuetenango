import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { equipoService } from '@/services/equipoService';
import { catalogoService } from '@/services/catalogoService';
import { Area, Estado, Subgrupo, Proveedor, CreateEquipoData } from '@/types/equipo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EquipoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Catálogos
  const [areas, setAreas] = useState<Area[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Formulario
  const [formData, setFormData] = useState<CreateEquipoData>({
    codigoSICOIN: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    precioUnitario: 0,
    numeroFactura: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    areaId: 0,
    estadoId: 1,
    subgrupoId: 0,
    proveedorId: undefined,
    observaciones: '',
  });

  useEffect(() => {
    cargarCatalogos();
    if (isEditing) {
      cargarEquipo();
    }
  }, [isEditing, id]);

  const cargarCatalogos = async () => {
    try {
      const [areasData, estadosData, subgruposData, proveedoresData] = await Promise.all([
        catalogoService.obtenerAreas(),
        catalogoService.obtenerEstados(),
        catalogoService.obtenerSubgrupos(),
        catalogoService.obtenerProveedores(),
      ]);

      setAreas(areasData);
      setEstados(estadosData);
      setSubgrupos(subgruposData);
      setProveedores(proveedoresData);

      // Establecer valores por defecto
      if (!isEditing && areasData.length > 0) {
        setFormData(prev => ({ ...prev, areaId: areasData[0].id }));
      }
      if (!isEditing && subgruposData.length > 0) {
        setFormData(prev => ({ ...prev, subgrupoId: subgruposData[0].id }));
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      setError('Error al cargar los catálogos');
    }
  };

  const cargarEquipo = async () => {
  if (!id) return;

  try {
    setLoadingData(true);
    const equipo = await equipoService.obtenerPorId(parseInt(id));

    setFormData({
      codigoSICOIN: equipo.codigoSICOIN,
      descripcion: equipo.descripcion,
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      numeroSerie: equipo.numeroSerie || '',
      precioUnitario: equipo.precioUnitario, // ✅ YA VIENE EN CENTAVOS desde BD
      numeroFactura: equipo.numeroFactura || '',
      fechaIngreso: equipo.fechaIngreso.split('T')[0],
      areaId: equipo.area?.id || 0,
      estadoId: equipo.estado?.id || 1,
      subgrupoId: equipo.subgrupo?.id || 0,
      proveedorId: equipo.proveedor?.id,
      observaciones: equipo.observaciones || '',
    });
  } catch (error) {
    console.error('Error al cargar equipo:', error);
    setError('Error al cargar el equipo');
  } finally {
    setLoadingData(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
        // Preparar datos
        const dataToSend = {
        ...formData,
        precioUnitario: Math.round(formData.precioUnitario), // Ya está en centavos
        // Asegurar que la fecha esté en formato YYYY-MM-DD
        fechaIngreso: formData.fechaIngreso.split('T')[0],
        marca: formData.marca || undefined,
        modelo: formData.modelo || undefined,
        numeroSerie: formData.numeroSerie || undefined,
        numeroFactura: formData.numeroFactura || undefined,
        observaciones: formData.observaciones || undefined,
        proveedorId: formData.proveedorId || undefined,
        };

        // Debug: ver qué datos se están enviando
        console.log('📤 Datos a enviar:', dataToSend);
        console.log('🆔 ID del equipo:', id);

        if (isEditing && id) {
        await equipoService.actualizar(parseInt(id), dataToSend);
        setSuccess('Equipo actualizado exitosamente');
        } else {
        await equipoService.crear(dataToSend);
        setSuccess('Equipo creado exitosamente');
        }

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
        navigate('/equipos');
        }, 1500);
    } catch (err: any) {
        console.error('Error al guardar equipo:', err);
        setError(err.response?.data?.error?.message || 'Error al guardar el equipo');
    } finally {
        setLoading(false);
    }
    };

  const handleChange = (field: keyof CreateEquipoData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifica los datos del equipo' : 'Registra un nuevo equipo en el inventario'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/equipos')}>
          Volver
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

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Código SICOIN y Subgrupo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoSICOIN">
                  Código SICOIN <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="codigoSICOIN"
                  value={formData.codigoSICOIN}
                  onChange={(e) => handleChange('codigoSICOIN', e.target.value)}
                  placeholder="Ej: 323-001-2025"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subgrupoId">
                  Subgrupo SICOIN <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subgrupoId.toString()}
                  onValueChange={(value) => handleChange('subgrupoId', parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un subgrupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {subgrupos.map((subgrupo) => (
                      <SelectItem key={subgrupo.id} value={subgrupo.id.toString()}>
                        {subgrupo.codigo} - {subgrupo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Descripción detallada del equipo"
                required
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Marca, Modelo y Número de Serie */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => handleChange('marca', e.target.value)}
                  placeholder="Ej: Stryker"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                  placeholder="Ej: Prime Series"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Número de Serie</Label>
                <Input
                  id="numeroSerie"
                  value={formData.numeroSerie}
                  onChange={(e) => handleChange('numeroSerie', e.target.value)}
                  placeholder="Ej: STR-2025-001"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Precio y Factura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precioUnitario">
                    Precio Unitario (Q) <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="precioUnitario"
                    type="number"
                    step="0.01"
                    value={(formData.precioUnitario / 100).toFixed(2)}
                    onChange={(e) => handleChange('precioUnitario', Math.round(parseFloat(e.target.value || '0') * 100))}
                    placeholder="Ej: 15000.00"
                    required
                    disabled={loading}
                />
                </div>

              <div className="space-y-2">
                <Label htmlFor="numeroFactura">Número de Factura</Label>
                <Input
                  id="numeroFactura"
                  value={formData.numeroFactura}
                  onChange={(e) => handleChange('numeroFactura', e.target.value)}
                  placeholder="Ej: FAC-2025-001"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Fecha de Ingreso y Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaIngreso">
                  Fecha de Ingreso <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaIngreso"
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => handleChange('fechaIngreso', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedorId">Proveedor</Label>
                <Select
                  value={formData.proveedorId?.toString() || 'ninguno'}
                  onValueChange={(value) => 
                    handleChange('proveedorId', value === 'ninguno' ? undefined : parseInt(value))
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin proveedor</SelectItem>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id.toString()}>
                        {proveedor.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Área y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaId">
                  Área <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.areaId.toString()}
                  onValueChange={(value) => handleChange('areaId', parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoId">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.estadoId.toString()}
                  onValueChange={(value) => handleChange('estadoId', parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((estado) => (
                      <SelectItem key={estado.id} value={estado.id.toString()}>
                        {estado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales"
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/equipos')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? 'Actualizando...' : 'Creando...'}
                  </div>
                ) : (
                  isEditing ? 'Actualizar Equipo' : 'Crear Equipo'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}