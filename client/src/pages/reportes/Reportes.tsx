import { useState, useEffect } from 'react';
import { equipoService } from '@/services/equipoService';
import { catalogoService } from '@/services/catalogoService';
import { Equipo, Area } from '@/types/equipo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Reportes() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Búsqueda de equipos para QR
  const [busquedaQR, setBusquedaQR] = useState('');
  const [equiposQR, setEquiposQR] = useState<Equipo[]>([]);
  const [loadingQR, setLoadingQR] = useState(false);

  // QR seleccionado
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState('');
  const [equipoQR, setEquipoQR] = useState<Equipo | null>(null);

  useEffect(() => {
    cargarAreas();
  }, []);

  useEffect(() => {
    if (busquedaQR.length >= 3) {
      buscarEquiposQR();
    } else {
      setEquiposQR([]);
    }
  }, [busquedaQR]);

  const cargarAreas = async () => {
    try {
      const areasData = await catalogoService.obtenerAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  const buscarEquiposQR = async () => {
    try {
      setLoadingQR(true);
      const response = await equipoService.listar({
        busqueda: busquedaQR,
        limit: 10,
      });
      setEquiposQR(response.data);
    } catch (error) {
      console.error('Error al buscar equipos:', error);
    } finally {
      setLoadingQR(false);
    }
  };

  const generarQR = async (equipo: Equipo) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `http://localhost:3000/api/reportes/qr/${equipo.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar QR');
      }

      const data = await response.json();
      setQrData(data.data.qr);
      setEquipoQR(equipo);
      setShowQR(true);
    } catch (error) {
      console.error('Error al generar QR:', error);
      setError('Error al generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  const descargarInventario = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'http://localhost:3000/api/reportes/inventario',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar inventario:', error);
      setError('Error al generar el reporte de inventario');
    } finally {
      setLoading(false);
    }
  };

  const descargarTarjeta = async () => {
    if (areaSeleccionada === 0) {
      setError('Debes seleccionar un área');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `http://localhost:3000/api/reportes/tarjeta/${areaSeleccionada}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar tarjeta');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarjeta-responsabilidad-area-${areaSeleccionada}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar tarjeta:', error);
      setError('Error al generar la tarjeta de responsabilidad');
    } finally {
      setLoading(false);
    }
  };

  const imprimirQR = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Código QR - ${equipoQR?.codigoSICOIN}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            img {
              max-width: 300px;
              height: auto;
            }
            h2 {
              margin: 20px 0 10px 0;
            }
            p {
              margin: 5px 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qrData}" alt="Código QR" />
            <h2>${equipoQR?.codigoSICOIN}</h2>
            <p>${equipoQR?.descripcion}</p>
            <p><strong>Área:</strong> ${equipoQR?.area?.nombre}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          Genera reportes y códigos QR para equipos
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Códigos QR */}
        <Card>
          <CardHeader>
            <CardTitle>Códigos QR de Equipos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="busquedaQR">Buscar Equipo</Label>
              <Input
                id="busquedaQR"
                placeholder="Buscar por código, descripción..."
                value={busquedaQR}
                onChange={(e) => setBusquedaQR(e.target.value)}
              />
              {loadingQR && (
                <p className="text-sm text-gray-500">Buscando equipos...</p>
              )}
            </div>

            {equiposQR.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposQR.map((equipo) => (
                      <TableRow key={equipo.id}>
                        <TableCell className="font-medium">
                          {equipo.codigoSICOIN}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {equipo.descripcion}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generarQR(equipo)}
                            disabled={loading}
                          >
                            Ver QR
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reporte de Inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Inventario Anual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Genera un reporte completo de todo el inventario en formato PDF.
              Incluye todos los equipos registrados con su información detallada.
            </p>
            <Button
              onClick={descargarInventario}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generando PDF...
                </div>
              ) : (
                <>
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Descargar Reporte de Inventario
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tarjeta de Responsabilidad */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tarjeta de Responsabilidad por Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Genera una tarjeta de responsabilidad con todos los equipos
              asignados a un área específica.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="area">Selecciona un Área</Label>
                <Select
                  value={areaSeleccionada.toString()}
                  onValueChange={(value) => setAreaSeleccionada(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" disabled>
                      Selecciona un área
                    </SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={descargarTarjeta}
                  disabled={loading || areaSeleccionada === 0}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generando...
                    </div>
                  ) : (
                    <>
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Descargar Tarjeta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de QR */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código QR del Equipo</DialogTitle>
            <DialogDescription>
              {equipoQR?.codigoSICOIN} - {equipoQR?.descripcion}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            {qrData && (
              <img
                src={qrData}
                alt="Código QR"
                className="w-64 h-64 border rounded-lg"
              />
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowQR(false)}>
              Cerrar
            </Button>
            <Button onClick={imprimirQR}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}