import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck(): { status: string; version: string } {
    return { status: 'ok', version: '1.0.0' };
  }
}
