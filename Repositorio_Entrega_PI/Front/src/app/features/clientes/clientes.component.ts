import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { Cliente } from '../../shared/models/entidades.model';
import { ClienteService } from '../../shared/services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  clientes = signal<Cliente[]>([]);
  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  filtroGlobal = '';

  tipos = [
    { label: 'Cliente', value: 'Cliente' },
    { label: 'Proveedor', value: 'Proveedor' },
    { label: 'Transportista', value: 'Transportista' }
  ];

  entidad: Partial<Cliente> = {};

  constructor(
    private readonly service: ClienteService,
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
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  nuevo(): void {
    this.entidad = { estado: true, tipo: 'Cliente' };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(cliente: Cliente): void {
    this.entidad = { ...cliente };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  guardar(): void {
    if (!this.entidad.identificacion || !this.entidad.nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Identificación y nombre son obligatorios.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Cliente guardado correctamente.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el cliente.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.id!, this.entidad).subscribe(alGuardar);
    }
  }

  eliminar(cliente: Cliente): void {
    this.confirmationService.confirm({
      message: `¿Eliminar al cliente "${cliente.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(cliente.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado.' });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el cliente.' })
        });
      }
    });
  }
}
