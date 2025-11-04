import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export class FotoService {
  private uploadsDir = path.join(__dirname, '../../uploads/equipos');

  /**
   * Procesar y guardar foto
   */
  async procesarFoto(file: Buffer, equipoId: number): Promise<string> {
    // Crear directorio si no existe
    await fs.mkdir(this.uploadsDir, { recursive: true });

    // Nombre del archivo: equipo-{id}-{timestamp}.jpg
    const filename = `equipo-${equipoId}-${Date.now()}.jpg`;
    const filepath = path.join(this.uploadsDir, filename);

    // Comprimir y redimensionar imagen
    await sharp(file)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(filepath);

    // Retornar URL relativa
    return `/uploads/equipos/${filename}`;
  }

  /**
   * Eliminar foto anterior
   */
  async eliminarFoto(fotoUrl: string): Promise<void> {
    if (!fotoUrl) return;

    try {
      const filename = path.basename(fotoUrl);
      const filepath = path.join(this.uploadsDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      // Ignorar si no existe
      console.log('Error al eliminar foto:', error);
    }
  }

  /**
   * Obtener foto
   */
  async obtenerFoto(filename: string): Promise<Buffer> {
    const filepath = path.join(this.uploadsDir, filename);
    return await fs.readFile(filepath);
  }
}

export const fotoService = new FotoService();