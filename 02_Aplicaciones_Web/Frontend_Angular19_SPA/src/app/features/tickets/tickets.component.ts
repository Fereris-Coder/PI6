import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Cliente, Producto } from '../../shared/models/entidades.model';
import { Pesaje } from '../../shared/models/pesaje.model';
import { ClienteService } from '../../shared/services/cliente.service';
import { PesajeService } from '../../shared/services/pesaje.service';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './tickets.component.html'
})
export class TicketsComponent implements OnInit {
  pesajes = signal<Pesaje[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  cargando = signal(false);
  filtroGlobal = '';

  constructor(
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });

    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 30);

    this.cargando.set(true);
    this.pesajeService.listar(desde, hoy).subscribe({
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

  abrirTicketIngreso(pesaje: Pesaje): void {
    window.open(`/tickets/${pesaje.numTran}?vista=ingreso`, '_blank');
  }

  abrirTicket(pesaje: Pesaje): void {
    window.open(`/tickets/${pesaje.numTran}`, '_blank');
  }
}
