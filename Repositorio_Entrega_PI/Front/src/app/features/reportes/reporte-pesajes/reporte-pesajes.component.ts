import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { Balanza, Cliente, Producto, Usuario, Vehiculo } from '../../../shared/models/entidades.model';
import { Pesaje } from '../../../shared/models/pesaje.model';
import { ColumnaExport, ExportService } from '../../../shared/services/export.service';
import { BalanzaService } from '../../../shared/services/balanza.service';
import { ClienteService } from '../../../shared/services/cliente.service';
import { PesajeService } from '../../../shared/services/pesaje.service';
import { ProductoService } from '../../../shared/services/producto.service';
import { UsuarioService } from '../../../shared/services/usuario.service';
import { VehiculoService } from '../../../shared/services/vehiculo.service';

interface FilaReporte {
  numTran: number;
  fechaHoraIn: string;
  fechaHoraOut: string | null;
  placa: string;
  terceroLabel: string;
  terceroNombre: string;
  producto: string;
  basculaEntrada: string;
  operadorEntrada: string;
  basculaSalida: string;
  operadorSalida: string;
  pesoBruto: number;
  pesoTara: number;
  pesoNeto: number;
  estado: string;
}

@Component({
  selector: 'app-reporte-pesajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    TagModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    RouterLink
  ],
  templateUrl: './reporte-pesajes.component.html',
  styleUrl: './reporte-pesajes.component.scss'
})
export class ReportePesajesComponent implements OnInit {
  cargando = signal(false);
  filtroGlobal = '';

  desde: Date | null = null;
  hasta: Date | null = null;
  terceroId: number | null = null;
  proCodigo: number | null = null;
  vehPlaca: string | null = null;
  balId: number | null = null;
  usuId: number | null = null;
  estado: 'Todos' | 'Completado' | 'EnPatio' = 'Todos';

  private pesajes = signal<Pesaje[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  basculas = signal<Balanza[]>([]);
  usuarios = signal<Usuario[]>([]);

  readonly opcionesEstado = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Completado', value: 'Completado' },
    { label: 'En patio', value: 'EnPatio' }
  ];

  readonly filas = computed<FilaReporte[]>(() => {
    const clientes = this.clientes();
    const productos = this.productos();
    const basculas = this.basculas();
    const usuarios = this.usuarios();

    return this.pesajes()
      .filter((p) => {
        if (this.terceroId && p.cliId !== this.terceroId) return false;
        if (this.proCodigo && p.proCodigo !== this.proCodigo) return false;
        if (this.vehPlaca && p.vehPlaca !== this.vehPlaca) return false;
        if (this.balId && p.balId !== this.balId && p.balIdSalida !== this.balId) return false;
        if (this.usuId && p.usuIngId !== this.usuId && p.usuSalId !== this.usuId) return false;
        if (this.estado === 'Completado' && !p.fechaHoraOut) return false;
        if (this.estado === 'EnPatio' && p.fechaHoraOut) return false;
        return true;
      })
      .map((p): FilaReporte => {
        const cliente = clientes.find((c) => c.id === p.cliId);
        return {
          numTran: p.numTran,
          fechaHoraIn: p.fechaHoraIn,
          fechaHoraOut: p.fechaHoraOut ?? null,
          placa: p.vehPlaca,
          terceroLabel: cliente?.tipo ?? 'Cliente',
          terceroNombre: cliente?.nombre ?? '—',
          producto: productos.find((pr) => pr.codigo === p.proCodigo)?.nombre ?? '—',
          basculaEntrada: basculas.find((b) => b.id === p.balId)?.descripcion ?? '—',
          operadorEntrada: usuarios.find((u) => u.id === p.usuIngId)?.nombreCompleto ?? '—',
          basculaSalida: p.fechaHoraOut ? (basculas.find((b) => b.id === (p.balIdSalida ?? p.balId))?.descripcion ?? '—') : '—',
          operadorSalida: p.usuSalId ? (usuarios.find((u) => u.id === p.usuSalId)?.nombreCompleto ?? '—') : '—',
          pesoBruto: p.pesoBruto,
          pesoTara: p.pesoTara,
          pesoNeto: p.pesoNeto,
          estado: p.fechaHoraOut ? 'Completado' : 'En patio'
        };
      })
      .sort((a, b) => a.terceroNombre.localeCompare(b.terceroNombre) || b.numTran - a.numTran);
  });

  readonly totalNeto = computed(() => this.filas().reduce((acc, f) => acc + (f.pesoNeto || 0), 0));
  readonly totalRegistros = computed(() => this.filas().length);

  subtotalPorTercero(nombre: string): number {
    return this.filas()
      .filter((f) => f.terceroNombre === nombre)
      .reduce((acc, f) => acc + (f.pesoNeto || 0), 0);
  }

  private readonly columnasExport: ColumnaExport[] = [
    { header: 'N° Transacción', key: 'numTran' },
    { header: 'Fecha Entrada', key: 'fechaEntradaFmt' },
    { header: 'Fecha Salida', key: 'fechaSalidaFmt' },
    { header: 'Placa', key: 'placa' },
    { header: 'Tercero', key: 'terceroLabel' },
    { header: 'Nombre', key: 'terceroNombre' },
    { header: 'Producto', key: 'producto' },
    { header: 'Báscula Ent.', key: 'basculaEntrada' },
    { header: 'Operador Ent.', key: 'operadorEntrada' },
    { header: 'Báscula Sal.', key: 'basculaSalida' },
    { header: 'Operador Sal.', key: 'operadorSalida' },
    { header: 'Peso Bruto (kg)', key: 'pesoBruto' },
    { header: 'Peso Tara (kg)', key: 'pesoTara' },
    { header: 'Peso Neto (kg)', key: 'pesoNeto' },
    { header: 'Estado', key: 'estado' }
  ];

  constructor(
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly vehiculoService: VehiculoService,
    private readonly basculaService: BalanzaService,
    private readonly usuarioService: UsuarioService,
    private readonly exportService: ExportService,
    private readonly router: Router
  ) {
    const hoy = new Date();
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.hasta = hoy;
  }

  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });
    this.vehiculoService.listar().subscribe({ next: (data) => this.vehiculos.set(data) });
    this.basculaService.listar().subscribe({ next: (data) => this.basculas.set(data) });
    this.usuarioService.listar().subscribe({ next: (data) => this.usuarios.set(data) });
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.pesajeService.listar(this.desde, this.hasta).subscribe({
      next: (data) => {
        this.pesajes.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  limpiarFiltros(): void {
    this.terceroId = null;
    this.proCodigo = null;
    this.vehPlaca = null;
    this.balId = null;
    this.usuId = null;
    this.estado = 'Todos';
    this.buscar();
  }

  verTicket(numTran: number): void {
    window.open(`/tickets/${numTran}`, '_blank');
  }

  imprimir(): void {
    window.print();
  }

  private filasParaExportar(): Record<string, unknown>[] {
    return this.filas().map((f) => ({
      ...f,
      fechaEntradaFmt: this.formatearFecha(f.fechaHoraIn),
      fechaSalidaFmt: f.fechaHoraOut ? this.formatearFecha(f.fechaHoraOut) : 'Pendiente'
    }));
  }

  private formatearFecha(iso: string): string {
    const fecha = new Date(iso);
    return fecha.toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private subtituloReporte(): string {
    const desdeTxt = this.desde ? this.desde.toLocaleDateString('es-EC') : '—';
    const hastaTxt = this.hasta ? this.hasta.toLocaleDateString('es-EC') : '—';
    return `Rango: ${desdeTxt} - ${hastaTxt}  |  Total registros: ${this.totalRegistros()}  |  Total Neto: ${this.totalNeto().toFixed(2)} kg`;
  }

  exportarPdf(): void {
    this.exportService.exportarPdf(
      'Reporte General de Pesajes',
      this.columnasExport,
      this.filasParaExportar(),
      `reporte-pesajes-${this.marcaDeTiempoArchivo()}`,
      this.subtituloReporte()
    );
  }

  exportarExcel(): void {
    this.exportService.exportarExcel(this.columnasExport, this.filasParaExportar(), `reporte-pesajes-${this.marcaDeTiempoArchivo()}`, 'Pesajes');
  }

  private marcaDeTiempoArchivo(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
