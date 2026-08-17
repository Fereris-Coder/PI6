export const TOKEN_KEY = 'balanza_token';

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
export const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export interface TokenClaims {
  sub: string;
  exp: number;
  [key: string]: unknown;
}

export interface UsuarioActual {
  id: number;
  nombreUsuario: string;
  rolId: number;
}
