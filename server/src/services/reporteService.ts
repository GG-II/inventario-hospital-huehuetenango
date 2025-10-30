import PDFDocument from 'pdfkit';
import { db } from '../config/database';
import { equipos, areas, estados, subgrupos } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ReporteService {
  /**
   * Generar reporte de inventario anual
   */
  async generarReporteInventario(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Encabezado
        doc.fontSize(16).text('Hospital Regional de Huehuetenango', { align: 'center' });
        doc.fontSize(14).text('Reporte de Inventario Anual', { align: 'center' });
        doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, { align: 'center' });
        doc.moveDown(2);

        // Obtener todos los equipos
        const todosEquipos = await db
          .select({
            id: equipos.id,
            codigoSICOIN: equipos.codigoSICOIN,
            descripcion: equipos.descripcion,
            marca: equipos.marca,
            modelo: equipos.modelo,
            numeroSerie: equipos.numeroSerie,
            precioUnitario: equipos.precioUnitario,
            area: areas.nombre,
            estado: estados.nombre,
            subgrupo: subgrupos.nombre,
          })
          .from(equipos)
          .leftJoin(areas, eq(equipos.areaId, areas.id))
          .leftJoin(estados, eq(equipos.estadoId, estados.id))
          .leftJoin(subgrupos, eq(equipos.subgrupoId, subgrupos.id))
          .orderBy(equipos.codigoSICOIN);

        // Tabla de equipos
        doc.fontSize(12).text('Listado de Equipos', { underline: true });
        doc.moveDown();

        let y = doc.y;
        todosEquipos.forEach((equipo, index) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(9);
          doc.text(`${index + 1}. ${equipo.codigoSICOIN}`, 50, y);
          doc.text(`${equipo.descripcion}`, 150, y, { width: 200 });
          doc.text(`${equipo.area || 'N/A'}`, 360, y);
          doc.text(`${equipo.estado || 'N/A'}`, 480, y);
          
          y += 20;
        });

        // Resumen
        doc.addPage();
        doc.fontSize(14).text('Resumen', { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(`Total de equipos: ${todosEquipos.length}`);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar tarjeta de responsabilidad por área
   */
  async generarTarjetaResponsabilidad(areaId: number): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtener área
        const [area] = await db
          .select()
          .from(areas)
          .where(eq(areas.id, areaId))
          .limit(1);

        if (!area) {
          throw new Error('Área no encontrada');
        }

        // Obtener equipos del área
        const equiposArea = await db
          .select({
            codigoSICOIN: equipos.codigoSICOIN,
            descripcion: equipos.descripcion,
            marca: equipos.marca,
            modelo: equipos.modelo,
            numeroSerie: equipos.numeroSerie,
            precioUnitario: equipos.precioUnitario,
            estado: estados.nombre,
          })
          .from(equipos)
          .leftJoin(estados, eq(equipos.estadoId, estados.id))
          .where(eq(equipos.areaId, areaId))
          .orderBy(equipos.codigoSICOIN);

        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Encabezado
        doc.fontSize(16).text('Hospital Regional de Huehuetenango', { align: 'center' });
        doc.fontSize(14).text('TARJETA DE RESPONSABILIDAD', { align: 'center' });
        doc.moveDown(2);

        // Datos del área
        doc.fontSize(12).text(`Área: ${area.nombre}`);
        doc.text(`Jefe: ${area.jefe}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`);
        doc.moveDown(2);

        // Tabla de equipos
        doc.fontSize(10).text('Equipos asignados:', { underline: true });
        doc.moveDown();

        let y = doc.y;
        let totalValor = 0;

        equiposArea.forEach((equipo, index) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const precio = equipo.precioUnitario || 0;
          totalValor += precio;

          doc.fontSize(8);
          doc.text(`${index + 1}`, 50, y);
          doc.text(`${equipo.codigoSICOIN}`, 70, y);
          doc.text(`${equipo.descripcion.substring(0, 40)}`, 150, y, { width: 200 });
          doc.text(`Q ${precio.toFixed(2)}`, 400, y);
          doc.text(`${equipo.estado || 'N/A'}`, 480, y);

          y += 15;
        });

        // Total
        doc.moveDown();
        doc.fontSize(10);
        doc.text(`Total de equipos: ${equiposArea.length}`);
        doc.text(`Valor total: Q ${totalValor.toFixed(2)}`);

        // Espacios para firmas
        doc.moveDown(4);
        doc.text('_________________________', 50);
        doc.text('Recibí conforme', 50);
        doc.text(`Jefe de ${area.nombre}`, 50);

        doc.text('_________________________', 350);
        doc.text('Entregado por', 350);
        doc.text('Departamento de Inventarios', 350);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const reporteService = new ReporteService();