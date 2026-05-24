import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplaintsModule } from './complaints/complaints.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ComplaintsModule,
  ],
})
export class AppModule {}
