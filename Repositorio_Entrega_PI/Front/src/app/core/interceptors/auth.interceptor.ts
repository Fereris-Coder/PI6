import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TOKEN_KEY } from '../models/auth.model';

// No inyecta AuthService a propósito: AuthService depende de RolService para
// cargar permisos, y esa llamada HTTP pasa por este interceptor — si aquí se
// inyectara AuthService, se generaría una dependencia circular en el momento
// en que AuthService todavía se está construyendo. Por eso el token se lee
// directamente del storage en vez de vía auth.obtenerToken().
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
