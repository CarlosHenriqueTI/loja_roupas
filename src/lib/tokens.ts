import { randomBytes, randomInt } from 'crypto';

export function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateResetCode(): string {
  // Gera código de 6 dígitos
  return randomInt(100000, 999999).toString();
}

export function isTokenExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}

export function getTokenExpiration(hours: number): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
}