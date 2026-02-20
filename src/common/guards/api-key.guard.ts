import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Vérifier si la route est marquée @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    // 401 : header absent
    if (!apiKey) {
      throw new UnauthorizedException(
        'Missing API key. Add the header X-API-Key to your request.',
      );
    }

    const user = this.authService.findByApiKey(apiKey);

    // 403 : clef fournie mais inconnue
    if (!user) {
      throw new ForbiddenException('Invalid API key.');
    }

    // Attacher l'utilisateur à la requête pour les guards suivants
    (request as any).user = user;

    return true;
  }
}
