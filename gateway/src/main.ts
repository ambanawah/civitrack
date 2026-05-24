import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*', // tighten in production
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Gateway running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`→ auth-service : ${process.env.AUTH_SERVICE_URL}`, 'Bootstrap');
  Logger.log(`→ complaint-service : ${process.env.COMPLAINT_SERVICE_URL}`, 'Bootstrap');
}
bootstrap();
