import PDFDocument from 'pdfkit';
import { db } from '../config/database';
import { equipos, areas, estados, subgrupos } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ReporteService {
  /**
   * Dividir texto largo en múltiples líneas
   */
  private dividirTexto(doc: any, texto: string, maxWidth: number): string[] {
    const palabras = texto.split(' ');
    const lineas: string[] = [];
    let lineaActual = '';

    palabras.forEach((palabra) => {
      const testLine = lineaActual ? `${lineaActual} ${palabra}` : palabra;
      const ancho = doc.widthOfString(testLine);

      if (ancho > maxWidth && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabra;
      } else {
        lineaActual = testLine;
      }
    });

    if (lineaActual) {
      lineas.push(lineaActual);
    }

    return lineas;
  }

  /**
   * Truncar texto si es muy largo (solo para campos cortos)
   */
  private truncarTexto(texto: string, maxLength: number): string {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generar reporte de inventario anual
   */
  async generarReporteInventario(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
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

        // Título de la tabla
        doc.fontSize(12).text('Listado de Equipos', { underline: true });
        doc.moveDown(0.5);

        // Posiciones de columnas
        const col1X = 50;   // No.
        const col2X = 70;   // Código
        const col3X = 150;  // Descripción
        const col4X = 380;  // Área
        const col5X = 480;  // Estado

        // Función para dibujar encabezados
        const dibujarEncabezados = (y: number) => {
          doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold');
          doc.text('No.', col1X, y);
          doc.text('Código', col2X, y);
          doc.text('Descripción', col3X, y);
          doc.text('Área', col4X, y);
          doc.text('Estado', col5X, y);

          doc.moveTo(col1X, y + 12)
             .lineTo(550, y + 12)
             .stroke();
        };

        // Dibujar encabezados iniciales
        let tableTop = doc.y;
        dibujarEncabezados(tableTop);

        let y = tableTop + 18;
        doc.font('Helvetica');

        todosEquipos.forEach((equipo, index) => {
          // Calcular altura necesaria para la descripción
          doc.fontSize(8);
          const lineasDescripcion = this.dividirTexto(doc, equipo.descripcion, 220);
          const alturaFila = Math.max(15, lineasDescripcion.length * 10 + 5);

          // Si no cabe en la página actual, crear nueva página
          if (y + alturaFila > 700) {
            doc.addPage();
            y = 50;
            dibujarEncabezados(y);
            y += 18;
          }

          // Número
          doc.fontSize(8).text(`${index + 1}`, col1X, y);
          
          // Código
          doc.text(equipo.codigoSICOIN, col2X, y);

          // Descripción con múltiples líneas
          let descripcionY = y;
          lineasDescripcion.forEach((linea) => {
            doc.text(linea, col3X, descripcionY, { width: 220 });
            descripcionY += 10;
          });

          // Área
          doc.text(this.truncarTexto(equipo.area || 'N/A', 18), col4X, y);

          // Estado
          doc.text(this.truncarTexto(equipo.estado || 'N/A', 15), col5X, y);

          // Línea separadora
          y += alturaFila;
          doc.moveTo(col1X, y)
             .lineTo(550, y)
             .strokeColor('#E5E7EB')
             .stroke()
             .strokeColor('#000000');

          y += 3;
        });

        // Resumen - en la misma página si hay espacio
        if (y > 650) {
          doc.addPage();
          y = 50;
        } else {
          y += 15; // Espacio adicional después de la última fila
        }

        // Línea antes del resumen
        doc.moveTo(50, y)
           .lineTo(550, y)
           .strokeColor('#000000')
           .lineWidth(2)
           .stroke()
           .lineWidth(1);

        y += 15; // Espacio después de la línea
        doc.fontSize(14).font('Helvetica-Bold').text('Resumen', 50, y, { underline: true });
        y += 25;
        doc.fontSize(10).font('Helvetica').text(`Total de equipos: ${todosEquipos.length}`, 50, y);

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

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Encabezado
        doc.fontSize(16).text('Hospital Regional de Huehuetenango', { align: 'center' });
        doc.fontSize(14).text('TARJETA DE RESPONSABILIDAD', { align: 'center' });
        doc.moveDown(2);

        // Datos del área
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Área: ${area.nombre}`);
        doc.text(`Jefe: ${area.jefe || 'Por asignar'}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`);
        doc.moveDown(2);

        // Tabla de equipos
        doc.fontSize(10).font('Helvetica-Bold').text('Equipos asignados:', { underline: true });
        doc.moveDown(0.5);

        // Posiciones de columnas
        const col1X = 50;   // No.
        const col2X = 70;   // Código
        const col3X = 150;  // Descripción
        const col4X = 410;  // Precio
        const col5X = 490;  // Estado

        // Función para dibujar encabezados
        const dibujarEncabezados = (y: number) => {
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('No.', col1X, y);
          doc.text('Código', col2X, y);
          doc.text('Descripción', col3X, y);
          doc.text('Precio', col4X, y);
          doc.text('Estado', col5X, y);

          doc.moveTo(col1X, y + 12)
             .lineTo(550, y + 12)
             .stroke();
        };

        // Dibujar encabezados iniciales
        let tableTop = doc.y;
        dibujarEncabezados(tableTop);

        let y = tableTop + 18;
        let totalValor = 0;
        doc.font('Helvetica');

        equiposArea.forEach((equipo, index) => {
          // Calcular altura necesaria para la descripción
          doc.fontSize(8);
          const lineasDescripcion = this.dividirTexto(doc, equipo.descripcion, 250);
          const alturaFila = Math.max(15, lineasDescripcion.length * 10 + 5);

          // Si no cabe, nueva página
          if (y + alturaFila > 650) {
            doc.addPage();
            y = 50;
            dibujarEncabezados(y);
            y += 18;
          }

          const precio = (equipo.precioUnitario || 0) / 100;
          totalValor += precio;

          // Número
          doc.fontSize(8).text(`${index + 1}`, col1X, y);
          
          // Código
          doc.text(equipo.codigoSICOIN, col2X, y);

          // Descripción con múltiples líneas
          let descripcionY = y;
          lineasDescripcion.forEach((linea) => {
            doc.text(linea, col3X, descripcionY, { width: 250 });
            descripcionY += 10;
          });

          // Precio
          doc.text(
            `Q ${precio.toLocaleString('es-GT', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}`, 
            col4X, 
            y
          );

          // Estado
          doc.text(this.truncarTexto(equipo.estado || 'N/A', 12), col5X, y);

          // Línea separadora
          y += alturaFila;
          doc.moveTo(col1X, y)
             .lineTo(550, y)
             .strokeColor('#E5E7EB')
             .stroke()
             .strokeColor('#000000');

          y += 3;
        });

        // Total - en la misma página si hay espacio
        if (y > 620) {
          doc.addPage();
          y = 50;
        } else {
          y += 15; // Espacio adicional después de la última fila
        }

        // Línea antes del total
        doc.moveTo(50, y)
           .lineTo(550, y)
           .strokeColor('#000000')
           .lineWidth(2)
           .stroke()
           .lineWidth(1);

        y += 15; // Espacio después de la línea
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Total de equipos: ${equiposArea.length}`, 50, y);
        doc.text(
          `Valor total: Q ${totalValor.toLocaleString('es-GT', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}`, 
          300,
          y
        );

        // Espacios para firmas - ALINEADAS
        doc.moveDown(3);
        const firmaY = doc.y;

        // Firma izquierda
        doc.fontSize(10).font('Helvetica');
        doc.text('_________________________', 80, firmaY, { width: 150, align: 'center' });
        doc.text('Recibí conforme', 80, firmaY + 20, { width: 150, align: 'center' });
        doc.text(`Jefe de ${area.nombre}`, 80, firmaY + 35, { width: 150, align: 'center' });

        // Firma derecha - MISMA ALTURA
        doc.text('_________________________', 350, firmaY, { width: 150, align: 'center' });
        doc.text('Entregado por', 350, firmaY + 20, { width: 150, align: 'center' });
        doc.text('Departamento de Inventarios', 350, firmaY + 35, { width: 150, align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const reporteService = new ReporteService();