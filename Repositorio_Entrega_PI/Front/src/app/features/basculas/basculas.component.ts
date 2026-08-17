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
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { Balanza } from '../../shared/models/entidades.model';
import { EstadoBalanza, EstadoConexion } from '../../shared/models/balanza-live.model';
import { BalanzaService } from '../../shared/services/balanza.service';

@Component({
  selector: 'app-basculas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TagModule
  ],
  templateUrl: './basculas.component.html'
})
export class BasculasComponent implements OnInit {
  balanzas = signal<Balanza[]>([]);
  estados = signal<Map<number, EstadoBalanza>>(new Map());
  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  filtroGlobal = '';

  entidad: Partial<Balanza> = {};

  constructor(
    private readonly service: BalanzaService,
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
        this.balanzas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });

    this.service.obtenerEstadoTodas().subscribe({
      next: (data) => {
        this.estados.set(new Map(data.map((e) => [e.id, e])));
      },
      error: () => undefined
    });
  }

  estadoConexion(id: number): string {
    const estado = this.estados().get(id)?.estado;
    switch (estado) {
      case EstadoConexion.Conectada:
        return 'Conectada';
      case EstadoConexion.Conectando:
        return 'Conectando';
      default:
        return 'Desconectada';
    }
  }

  severidadEstado(id: number): 'success' | 'warn' | 'danger' {
    const estado = this.estados().get(id)?.estado;
    if (estado === EstadoConexion.Conectada) return 'success';
    if (estado === EstadoConexion.Conectando) return 'warn';
    return 'danger';
  }

  nuevo(): void {
    this.entidad = { estado: true };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(balanza: Balanza): void {
    this.entidad = { ...balanza };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  guardar(): void {
    if (!this.entidad.descripcion || !this.entidad.ip || !this.entidad.puerto) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Descripción, IP y puerto son obligatorios.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Báscula guardada correctamente. Reinicia el backend para aplicar cambios de conexión.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la báscula.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.id!, this.entidad).subscribe(alGuardar);
    }
  }

  eliminar(balanza: Balanza): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la báscula "${balanza.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(balanza.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Báscula eliminada.' });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la báscula.' })
        });
      }
    });
  }
}
