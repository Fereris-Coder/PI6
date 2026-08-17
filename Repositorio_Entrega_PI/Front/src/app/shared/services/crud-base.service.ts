import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export abstract class CrudBaseService<T> {
  protected constructor(protected readonly http: HttpClient, private readonly resource: string) {}

  protected get baseUrl(): string {
    return `${environment.apiUrl}/${this.resource}`;
  }

  listar(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl);
  }

  obtener(id: string | number): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  crear(entidad: Partial<T>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, entidad);
  }

  actualizar(id: string | number, entidad: Partial<T>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, entidad);
  }

  eliminar(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
