import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Rol } from '../../shared/models/entidades.model';
import { RolService } from '../../shared/services/rol.service';
import { CLAIM_NAME, CLAIM_ROLE, LoginRequest, LoginResponse, TOKEN_KEY, TokenClaims, UsuarioActual } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<UsuarioActual | null>(this.leerUsuarioDesdeToken());
  private readonly permisosSignal = signal<string[]>([]);

  // El guard de rutas y el filtro del menú esperan esta promesa antes de decidir,
  // para no tomar una decisión de acceso con los permisos todavía sin cargar
  // (por ejemplo justo después de recargar la página).
  private permisosListos: Promise<void>;

  readonly usuario = computed(() => this.usuarioSignal());
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);
  readonly permisos = computed(() => this.permisosSignal());

  constructor(private readonly http: HttpClient, private readonly rolService: RolService) {
    const usuario = this.usuarioSignal();
    this.permisosListos = usuario ? this.cargarPermisos(usuario.rolId) : Promise.resolve();
  }

  // recordar=true persiste la sesión entre reinicios del navegador (localStorage);
  // recordar=false la limita a la pestaña actual (sessionStorage), como el checkbox "Recordarme".
  login(credenciales: LoginRequest, recordar = true): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((respuesta) => {
        this.limpiarAlmacenamiento();
        const storage = recordar ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, respuesta.token);
        const usuario = this.leerUsuarioDesdeToken();
        this.usuarioSignal.set(usuario);
        this.permisosListos = usuario ? this.cargarPermisos(usuario.rolId) : Promise.resolve();
      })
    );
  }

  logout(): void {
    this.limpiarAlmacenamiento();
    this.usuarioSignal.set(null);
    this.permisosSignal.set([]);
    this.permisosListos = Promise.resolve();
  }

  async esperarPermisos(): Promise<void> {
    await this.permisosListos;
  }

  tieneModulo(clave: string): boolean {
    return this.permisosSignal().includes(clave);
  }

  private async cargarPermisos(rolId: number): Promise<void> {
    try {
      const rol = await firstValueFrom(this.rolService.obtener(rolId));
      this.permisosSignal.set((rol as Rol).modulos ?? []);
    } catch {
      this.permisosSignal.set([]);
    }
  }

  obtenerToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  private limpiarAlmacenamiento(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  private leerUsuarioDesdeToken(): UsuarioActual | null {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const claims = jwtDecode<TokenClaims>(token);
      if (claims.exp * 1000 < Date.now()) {
        this.limpiarAlmacenamiento();
        return null;
      }

      return {
        id: Number(claims.sub),
        nombreUsuario: String(claims[CLAIM_NAME] ?? ''),
        rolId: Number(claims[CLAIM_ROLE] ?? 0)
      };
    } catch {
      this.limpiarAlmacenamiento();
      return null;
    }
  }
}
