import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AsistenteService } from '../../shared/services/asistente.service';

interface MensajeChat {
  autor: 'usuario' | 'asistente';
  texto: string;
  esError?: boolean;
}

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ProgressSpinnerModule],
  templateUrl: './asistente.component.html',
  styleUrl: './asistente.component.scss'
})
export class AsistenteComponent {
  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  readonly mensajes = signal<MensajeChat[]>([
    {
      autor: 'asistente',
      texto:
        'Hola, soy el asistente del sistema. Preguntame sobre pesajes, producción, clientes/proveedores o básculas — por ejemplo: "¿cuánto pesó el Proveedor A esta semana?" o "¿cuál fue el producto con más volumen este mes?".'
    }
  ]);

  readonly cargando = signal(false);
  pregunta = '';

  constructor(private readonly asistenteService: AsistenteService) {}

  enviar(): void {
    const texto = this.pregunta.trim();
    if (!texto || this.cargando()) {
      return;
    }

    this.mensajes.update((actual) => [...actual, { autor: 'usuario', texto }]);
    this.pregunta = '';
    this.cargando.set(true);
    this.desplazarAlFinal();

    this.asistenteService.consultar(texto).subscribe({
      next: (res) => {
        this.mensajes.update((actual) => [...actual, { autor: 'asistente', texto: res.respuesta }]);
        this.cargando.set(false);
        this.desplazarAlFinal();
      },
      error: (err) => {
        const detalle = err?.error?.message ?? 'No se pudo contactar al asistente. Intenta de nuevo.';
        this.mensajes.update((actual) => [...actual, { autor: 'asistente', texto: detalle, esError: true }]);
        this.cargando.set(false);
        this.desplazarAlFinal();
      }
    });
  }

  private desplazarAlFinal(): void {
    setTimeout(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 50);
  }
}
