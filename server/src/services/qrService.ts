import QRCode from 'qrcode';

export class QRService {
  /**
   * Generar código QR como Data URL
   */
  async generarQR(equipoId: number): Promise<string> {
    const url = `http://localhost:3000/api/equipos/${equipoId}`;
    
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
      });
      
      return qrDataURL;
    } catch (error) {
      throw new Error('Error al generar código QR');
    }
  }
}

export const qrService = new QRService();