export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}
