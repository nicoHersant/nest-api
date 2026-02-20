import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): { status: string; version: string } {
    return { status: 'ok', version: '1.0.0' };
  }
}
