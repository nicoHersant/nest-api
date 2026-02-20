import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_ADMIN_KEY } from '../decorators/admin.decorator';
import type { User } from '../../auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as User | undefined;

    // L'ApiKeyGuard a déjà garanti que req.user existe.
    // Ici on vérifie uniquement le rôle.
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException(
        'This action requires administrator privileges.',
      );
    }

    return true;
  }
}
