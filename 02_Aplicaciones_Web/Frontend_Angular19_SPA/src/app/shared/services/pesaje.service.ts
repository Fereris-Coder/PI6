import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuardarPesajeDirectoRequest, GuardarPesajeRequest, Pesaje, PesajeSalidaRequest, ResumenPesajeHoy } from '../models/pesaje.model';

@Injectable({ providedIn: 'root' })
export class PesajeService {
  private readonly baseUrl = `${environment.apiUrl}/pesajes`;

  constructor(private readonly http: HttpClient) {}

  listar(desde?: Date | null, hasta?: Date | null): Observable<Pesaje[]> {
    let params = new HttpParams();
    if (desde) {
      const desdeStr = this.formatoFechaLocal(desde);
      params = params.set('desde', desdeStr);
    }
    if (hasta) {
      const hastaStr = this.formatoFechaLocal(hasta);
      params = params.set('hasta', hastaStr);
    }
    return this.http.get<Pesaje[]>(this.baseUrl, { params });
  }

  private formatoFechaLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  obtener(numTran: number): Observable<Pesaje> {
    return this.http.get<Pesaje>(`${this.baseUrl}/${numTran}`);
  }

  registrarEntrada(request: GuardarPesajeRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, request);
  }

  registrarDirecto(request: GuardarPesajeDirectoRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/directo`, request);
  }

  marcarSalida(numTran: number, request: PesajeSalidaRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${numTran}/salida`, request);
  }

  resumenHoy(): Observable<ResumenPesajeHoy[]> {
    return this.http.get<ResumenPesajeHoy[]>(`${this.baseUrl}/resumen/hoy`);
  }
}
