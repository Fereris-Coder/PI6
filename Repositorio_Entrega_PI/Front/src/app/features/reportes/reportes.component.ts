import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Cliente, Producto } from '../../shared/models/entidades.model';
import { Pesaje, ResumenPesajeHoy } from '../../shared/models/pesaje.model';
import { ClienteService } from '../../shared/services/cliente.service';
import { PesajeService } from '../../shared/services/pesaje.service';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, TableModule, RouterLink, ToastModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  pesajes = signal<Pesaje[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  resumenHoy = signal<ResumenPesajeHoy[]>([]);
  cargando = signal(false);

  desde: Date | null = null;
  hasta: Date | null = null;

  readonly totalNeto = computed(() => this.pesajes().reduce((acc, p) => acc + (p.pesoNeto || 0), 0));
  readonly totalCompletados = computed(() => this.pesajes().filter((p) => !!p.fechaHoraOut).length);
  readonly totalEnPatio = computed(() => this.pesajes().filter((p) => !p.fechaHoraOut).length);

  constructor(
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly messageService: MessageService
  ) {
    const hoy = new Date();
    // Default: desde el inicio del mes hasta hoy
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.hasta = hoy;
  }

  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });
    this.pesajeService.resumenHoy().subscribe({ next: (data) => this.resumenHoy.set(data) });
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.pesajeService.listar(this.desde, this.hasta).subscribe({
      next: (data) => {
        const ordenados = data.sort((a, b) => b.numTran - a.numTran);
        this.pesajes.set(ordenados);
        this.cargando.set(false);
        this.messageService.add({
          severity: 'info',
          summary: 'Reporte Generado',
          detail: `Se encontraron ${ordenados.length} pesajes en el período consultado.`,
          life: 3000
        });
      },
      error: () => {
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al consultar',
          detail: 'No se pudieron obtener los datos del servidor.',
          life: 4000
        });
      }
    });
  }

  nombreCliente(id: number): string {
    return this.clientes().find((c) => c.id === id)?.nombre ?? '—';
  }

  nombreProducto(codigo: number): string {
    return this.productos().find((p) => p.codigo === codigo)?.nombre ?? '—';
  }
}
