import { UnauthorizedException } from '@nestjs/common';
import type { AuthRequest } from './interfaces/auth-request.interface';

export function getUserId(req: AuthRequest): string {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException('User not found');
  return userId;
}
