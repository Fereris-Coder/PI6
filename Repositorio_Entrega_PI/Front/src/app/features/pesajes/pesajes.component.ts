import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { Cliente, Producto } from '../../shared/models/entidades.model';
import { Pesaje } from '../../shared/models/pesaje.model';
import { ClienteService } from '../../shared/services/cliente.service';
import { PesajeService } from '../../shared/services/pesaje.service';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-pesajes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DatePickerModule, TableModule, TagModule, ToolbarModule],
  templateUrl: './pesajes.component.html'
})
export class PesajesComponent implements OnInit {
  pesajes = signal<Pesaje[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  cargando = signal(false);

  desde: Date | null = null;
  hasta: Date | null = null;

  constructor(
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly router: Router
  ) {
    const hoy = new Date();
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
    this.hasta = hoy;
  }

  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.pesajeService.listar(this.desde, this.hasta).subscribe({
      next: (data) => {
        this.pesajes.set(data.sort((a, b) => b.numTran - a.numTran));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  nombreCliente(id: number): string {
    return this.clientes().find((c) => c.id === id)?.nombre ?? '—';
  }

  nombreProducto(codigo: number): string {
    return this.productos().find((p) => p.codigo === codigo)?.nombre ?? '—';
  }

  verTicket(pesaje: Pesaje): void {
    window.open(`/tickets/${pesaje.numTran}`, '_blank');
  }

  nuevoPesaje(): void {
    this.router.navigate(['/pesajes/nuevo']);
  }

  irACerrarSalida(pesaje: Pesaje): void {
    this.router.navigate(['/pesajes/nuevo'], { queryParams: { cerrarNumTran: pesaje.numTran } });
  }
}
