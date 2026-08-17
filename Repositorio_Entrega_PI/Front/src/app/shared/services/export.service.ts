import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ColumnaExport {
  header: string;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportarPdf(titulo: string, columnas: ColumnaExport[], filas: Record<string, unknown>[], nombreArchivo: string, subtitulo?: string): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(titulo, 14, 15);

    let startY = 20;
    if (subtitulo) {
      doc.setFontSize(9);
      doc.text(subtitulo, 14, 21);
      startY = 26;
    }

    autoTable(doc, {
      startY,
      head: [columnas.map((c) => c.header)],
      body: filas.map((fila) => columnas.map((c) => this.valorCelda(fila[c.key]))),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [29, 78, 216] }
    });

    doc.save(`${nombreArchivo}.pdf`);
  }

  exportarExcel(columnas: ColumnaExport[], filas: Record<string, unknown>[], nombreArchivo: string, nombreHoja = 'Reporte'): void {
    const datos = filas.map((fila) => {
      const obj: Record<string, unknown> = {};
      columnas.forEach((c) => (obj[c.header] = this.valorCelda(fila[c.key])));
      return obj;
    });

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
  }

  private valorCelda(valor: unknown): string | number {
    if (valor === null || valor === undefined) return '-';
    if (typeof valor === 'number') return valor;
    return String(valor);
  }
}
