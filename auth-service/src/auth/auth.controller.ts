import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // POST /auth/validate  ← called by gateway to validate tokens
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body('token') token: string) {
    return this.authService.validateToken(token);
  }

  // GET /auth/profile  ← requires valid JWT
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  // GET /auth/health
  @Get('health')
  health() {
    return { status: 'ok', service: 'auth-service' };
  }
}
