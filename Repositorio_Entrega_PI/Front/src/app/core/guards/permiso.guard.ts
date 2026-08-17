import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permisoGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const modulo = route.data?.['modulo'] as string | undefined;
  if (!modulo) return true;

  await auth.esperarPermisos();

  if (auth.tieneModulo(modulo)) return true;

  router.navigate(['/inicio']);
  return false;
};
