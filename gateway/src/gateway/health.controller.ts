import { Controller, Get } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

  @Get()
  async check() {
    const authUrl = this.config.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:3001';
    const complaintUrl = this.config.get<string>('COMPLAINT_SERVICE_URL') || 'http://complaint-service:3002';

    const checkService = async (name: string, url: string) => {
      try {
        const res = await firstValueFrom(this.http.get(url, { timeout: 3000 } as any));
        return { name, status: 'up', ...res.data };
      } catch {
        return { name, status: 'down' };
      }
    };

    const [auth, complaints] = await Promise.all([
      checkService('auth-service', `${authUrl}/auth/health`),
      checkService('complaint-service', `${complaintUrl}/complaints/health`),
    ]);

    return {
      gateway: 'up',
      overall: auth.status === 'up' && complaints.status === 'up' ? 'healthy' : 'degraded',
      services: { auth, complaints },
      timestamp: new Date().toISOString(),
    };
  }
}
