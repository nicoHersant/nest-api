import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  HttpCode,
  BadRequestException,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }
    return this.authService.register(body.email);
  }

  @Get('me')
  getMe(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    return this.authService.getMe(user.apiKey);
  }

  @Post('regenerate-key')
  regenerateKey(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    return this.authService.regenerateKey(user.apiKey);
  }

  @Delete('account')
  @HttpCode(204)
  deleteAccount(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    this.authService.deleteAccount(user.apiKey);
  }
}
