import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): { status: string; version: string } {
    return { status: 'ok', version: '1.0.0' };
  }

  /**
   * Route pédagogique : déclenche volontairement une erreur 500 non-HTTP
   * pour démontrer que le filtre global la capture et la formate proprement
   * sans exposer les détails internes.
   *
   * Accès : GET /api/demo-error (authentifié)
   */
  @Get('demo-error')
  demoError(): never {
    throw new Error('Simulated internal error — never expose this in production');
  }
}
