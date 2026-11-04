import crypto from 'crypto';

/**
 * Módulo de Seguridad y Criptografía para TaskGuard
 * - Hashing seguro de contraseñas usando scrypt con sal criptográfica única de 16 bytes
 * - Generación de tokens de sesión opacos de alta entropía (256 bits)
 * - Protección contra CSRF mediante tokens sincronizados
 * - Sanitización básica anti-XSS
 */

// Parámetros de scrypt recomendados para autenticación interactiva
const SCRYPT_KEYLEN = 64;

export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * Genera un hash criptográfico seguro para la contraseña con una sal aleatoria
 */
export function hashPassword(password: string): HashResult {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verifica una contraseña candidata contra el hash y sal almacenados
 * Utiliza crypto.timingSafeEqual para prevenir ataques de temporización (timing attacks)
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const hashBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== hashBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, hashBuffer);
  } catch {
    return false;
  }
}

/**
 * Genera un token de sesión opaco seguro de 64 caracteres hexadecimales (32 bytes aleatorios)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera un token CSRF criptográfico
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Sanitiza texto para prevenir inyecciones y XSS
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Elimina etiquetas potencialmente peligrosas
    .slice(0, 1000); // Límite de longitud defensivo
}
