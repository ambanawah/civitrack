import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthProxyController } from './auth-proxy.controller';
import { JwtStrategy } from '../common/guards/jwt.strategy';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'civitrack_super_secret_key_change_in_production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthProxyController],
  providers: [JwtStrategy],
})
export class AuthProxyModule {}
