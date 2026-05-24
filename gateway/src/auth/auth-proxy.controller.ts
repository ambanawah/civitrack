import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthProxyController {
  private readonly authUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {
    this.authUrl = config.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:3001';
  }

  @Post('register')
  async register(@Body() body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.authUrl}/auth/register`, body),
    );
    return res.data;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const res = await firstValueFrom(
      this.http.post(`${this.authUrl}/auth/login`, body),
    );
    return res.data;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Request() req) {
    const res = await firstValueFrom(
      this.http.get(`${this.authUrl}/auth/profile`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return res.data;
  }

  @Get('health')
  async health() {
    const res = await firstValueFrom(
      this.http.get(`${this.authUrl}/auth/health`),
    );
    return res.data;
  }
}
