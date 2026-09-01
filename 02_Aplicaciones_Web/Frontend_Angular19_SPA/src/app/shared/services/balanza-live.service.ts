import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { PesajeReading } from '../models/balanza-live.model';

@Injectable({ providedIn: 'root' })
export class BalanzaLiveService {
  private connection?: signalR.HubConnection;
  private conectando?: Promise<void>;
  private readonly lecturas$ = new Subject<PesajeReading>();

  constructor(private readonly auth: AuthService) {}

  private async asegurarConexion(): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.conectando) {
      return this.conectando;
    }

    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(environment.hubUrl, { accessTokenFactory: () => this.auth.obtenerToken() ?? '' })
        .withAutomaticReconnect()
        .build();

      this.connection.on('NuevaLectura', (lectura: PesajeReading) => this.lecturas$.next(lectura));
    }

    this.conectando = this.connection.start();
    try {
      await this.conectando;
    } finally {
      this.conectando = undefined;
    }
  }

  async suscribirse(balanzaId: number): Promise<void> {
    await this.asegurarConexion();
    await this.connection!.invoke('Suscribirse', balanzaId);
  }

  async desuscribirse(balanzaId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('Desuscribirse', balanzaId);
  }

  lecturasDe(balanzaId: number): Observable<PesajeReading> {
    return this.lecturas$.pipe(filter((lectura) => lectura.balanzaId === balanzaId));
  }
}
