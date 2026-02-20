import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Créer un compte et obtenir une clef API', description: 'Route publique. Retourne une clef API unique à utiliser dans le header X-API-Key.' })
  @ApiResponse({ status: 201, description: 'Compte créé — retourne { apiKey }' })
  @ApiResponse({ status: 400, description: 'Email invalide' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email);
  }

  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Informations du compte courant' })
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'Clef API obtenue à l\'inscription' })
  @ApiResponse({ status: 200, description: 'Informations du compte' })
  @ApiResponse({ status: 401, description: 'Clef API absente' })
  @ApiResponse({ status: 403, description: 'Clef API invalide' })
  @Get('me')
  getMe(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    return this.authService.getMe(user.apiKey);
  }

  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Régénérer la clef API', description: 'L\'ancienne clef est immédiatement invalidée.' })
  @ApiResponse({ status: 200, description: 'Nouvelle clef API — retourne { apiKey }' })
  @ApiResponse({ status: 401, description: 'Clef API absente' })
  @Post('regenerate-key')
  regenerateKey(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    return this.authService.regenerateKey(user.apiKey);
  }

  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Supprimer son compte', description: 'Action irréversible. La clef API est immédiatement révoquée.' })
  @ApiResponse({ status: 204, description: 'Compte supprimé' })
  @ApiResponse({ status: 401, description: 'Clef API absente' })
  @Delete('account')
  @HttpCode(204)
  deleteAccount(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    this.authService.deleteAccount(user.apiKey);
  }
}
