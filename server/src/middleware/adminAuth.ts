import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const getSecret = () => {
  if (!process.env.ADMIN_TOKEN_SECRET) throw new Error('ADMIN_TOKEN_SECRET is required');
  return process.env.ADMIN_TOKEN_SECRET;
};

const sign = (payload: string) => createHmac('sha256', getSecret()).update(payload).digest('hex');

export function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function credentialsAreValid(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  const usernameBuffer = Buffer.from(username);
  const passwordBuffer = Buffer.from(password);
  const expectedUsernameBuffer = Buffer.from(expectedUsername);
  const expectedPasswordBuffer = Buffer.from(expectedPassword);

  return usernameBuffer.length === expectedUsernameBuffer.length
    && passwordBuffer.length === expectedPasswordBuffer.length
    && timingSafeEqual(usernameBuffer, expectedUsernameBuffer)
    && timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ message: 'Admin authentication required' });

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return response.status(401).json({ message: 'Invalid admin session' });

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return response.status(401).json({ message: 'Invalid admin session' });
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { expiresAt?: number };
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return response.status(401).json({ message: 'Admin session expired' });
    }
    next();
  } catch {
    response.status(401).json({ message: 'Invalid admin session' });
  }
}
