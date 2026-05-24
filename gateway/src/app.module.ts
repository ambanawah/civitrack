import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyModule } from './auth/auth-proxy.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 10000 }),
    AuthProxyModule,
    GatewayModule,
  ],
})
export class AppModule {}
