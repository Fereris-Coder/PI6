import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Balanza } from '../models/entidades.model';
import { EstadoBalanza, PesajeReading } from '../models/balanza-live.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class BalanzaService extends CrudBaseService<Balanza> {
  constructor(http: HttpClient) {
    super(http, 'balanzas');
  }

  obtenerEstadoTodas(): Observable<EstadoBalanza[]> {
    return this.http.get<EstadoBalanza[]>(`${this.baseUrl}/estado`);
  }

  obtenerPeso(id: number): Observable<PesajeReading> {
    return this.http.get<PesajeReading>(`${this.baseUrl}/${id}/peso`);
  }
}
