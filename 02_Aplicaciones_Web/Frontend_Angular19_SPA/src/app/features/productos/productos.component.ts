import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { Producto } from '../../shared/models/entidades.model';
import { ProductoService } from '../../shared/services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  productos = signal<Producto[]>([]);
  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  filtroGlobal = '';

  entidad: Partial<Producto> = {};

  // Opciones de flujo
  opcionesTipoFlujo = ['Proveedor', 'Cliente'];

  constructor(
    private readonly service: ProductoService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  nuevo(): void {
    this.entidad = { estado: true, tipoFlujo: 'Proveedor', toleranciaMermaPct: 2.00 };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(producto: Producto): void {
    this.entidad = { ...producto };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  guardar(): void {
    if (!this.entidad.nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El nombre es obligatorio.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Producto guardado correctamente.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el producto.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.codigo!, this.entidad).subscribe(alGuardar);
    }
  }

  eliminar(producto: Producto): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el producto "${producto.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(producto.codigo).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado.' });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto.' })
        });
      }
    });
  }
}
