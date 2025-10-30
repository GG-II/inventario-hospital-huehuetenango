import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usuarioService } from '@/services/usuarioService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Perfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario de cambio de contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones básicas
    if (!passwordActual || !passwordNuevo || !confirmarPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (passwordNuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordNuevo !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordActual === passwordNuevo) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      await usuarioService.cambiarPassword({
        passwordActual,
        passwordNuevo,
        confirmarPassword,
      });

      setSuccess('Contraseña actualizada exitosamente');

      // Limpiar formulario
      setPasswordActual('');
      setPasswordNuevo('');
      setConfirmarPassword('');
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      setError(
        err.response?.data?.error?.message || 'Error al cambiar la contraseña'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Administra tu información y seguridad
        </p>
      </div>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">Nombre</Label>
              <p className="text-lg font-medium mt-1">{user?.nombre}</p>
            </div>
            <div>
              <Label className="text-gray-600">Usuario</Label>
              <p className="text-lg font-medium mt-1">{user?.username}</p>
            </div>
            <div>
              <Label className="text-gray-600">Email</Label>
              <p className="text-lg font-medium mt-1">{user?.email || 'No registrado'}</p>
            </div>
            <div>
              <Label className="text-gray-600">Rol</Label>
              <p className="text-lg font-medium mt-1">{user?.rol}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contraseña Actual */}
            <div className="space-y-2">
              <Label htmlFor="passwordActual">
                Contraseña Actual <span className="text-red-500">*</span>
              </Label>
              <Input
                id="passwordActual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
                required
              />
            </div>

            {/* Nueva Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="passwordNuevo">
                Nueva Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="passwordNuevo"
                type="password"
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmarPassword">
                Confirmar Nueva Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmarPassword"
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            {/* Requisitos de Contraseña */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Requisitos de la contraseña:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Mínimo 6 caracteres</li>
                <li>Debe ser diferente a tu contraseña actual</li>
                <li>Las contraseñas deben coincidir</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordActual('');
                  setPasswordNuevo('');
                  setConfirmarPassword('');
                  setError('');
                  setSuccess('');
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Actualizando...
                  </div>
                ) : (
                  'Cambiar Contraseña'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}