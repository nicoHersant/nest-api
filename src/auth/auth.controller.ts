import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('A valid email address is required');
    }
    return this.authService.register(body.email);
  }

  @Get('me')
  getMe(@Headers('x-api-key') apiKey: string) {
    if (!apiKey) {
      throw new BadRequestException('Header X-API-Key is required');
    }
    return this.authService.getMe(apiKey);
  }

  @Post('regenerate-key')
  regenerateKey(@Headers('x-api-key') apiKey: string) {
    if (!apiKey) {
      throw new BadRequestException('Header X-API-Key is required');
    }
    return this.authService.regenerateKey(apiKey);
  }

  @Delete('account')
  @HttpCode(204)
  deleteAccount(@Headers('x-api-key') apiKey: string) {
    if (!apiKey) {
      throw new BadRequestException('Header X-API-Key is required');
    }
    this.authService.deleteAccount(apiKey);
  }
}
