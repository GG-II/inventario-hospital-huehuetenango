import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Estado } from '@/types/equipo';

interface CambiarEstadoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (estadoId: number, observaciones: string) => void;
  loading: boolean;
  estados: Estado[];
  estadoActualId: number;
}

export default function CambiarEstadoModal({
  open,
  onClose,
  onConfirm,
  loading,
  estados,
  estadoActualId,
}: CambiarEstadoModalProps) {
  const [estadoId, setEstadoId] = useState<number>(estadoActualId);
  const [observaciones, setObservaciones] = useState('');

  const handleConfirm = () => {
    if (estadoId === estadoActualId) {
      return;
    }
    onConfirm(estadoId, observaciones);
  };

  const estadosPermitidos = estados.filter(
    (e) => e.nombre !== 'De baja (pendiente)' && e.nombre !== 'Dado de baja'
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Equipo</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado para este equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="estado">Nuevo Estado *</Label>
            <Select
              value={estadoId.toString()}
              onValueChange={(value) => setEstadoId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {estadosPermitidos.map((estado) => (
                  <SelectItem key={estado.id} value={estado.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            estado.color === 'green'
                              ? '#10b981'
                              : estado.color === 'yellow'
                              ? '#f59e0b'
                              : estado.color === 'gray'
                              ? '#6b7280'
                              : estado.color === 'blue'
                              ? '#3b82f6'
                              : estado.color === 'orange'
                              ? '#f97316'
                              : '#ef4444',
                        }}
                      />
                      {estado.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea
              id="observaciones"
              placeholder="Motivo del cambio de estado..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>

          {estadoId === estadoActualId && (
            <p className="text-sm text-yellow-600">
              ⚠️ Debes seleccionar un estado diferente al actual
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || estadoId === estadoActualId}
          >
            {loading ? 'Cambiando...' : 'Cambiar Estado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}