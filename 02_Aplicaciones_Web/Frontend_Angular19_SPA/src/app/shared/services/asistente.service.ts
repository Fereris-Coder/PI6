import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly baseUrl = `${environment.apiUrl}/asistente`;

  constructor(private readonly http: HttpClient) {}

  consultar(pregunta: string): Observable<{ respuesta: string }> {
    return this.http.post<{ respuesta: string }>(`${this.baseUrl}/consulta`, { pregunta });
  }
}
