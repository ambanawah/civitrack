import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CiviTrack API')
    .setDescription('Civic Complaint Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('complaints', 'Complaint management endpoints')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Gateway running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`→ auth-service : ${process.env.AUTH_SERVICE_URL}`, 'Bootstrap');
  Logger.log(`→ complaint-service : ${process.env.COMPLAINT_SERVICE_URL}`, 'Bootstrap');
  Logger.log(`🚀 Gateway running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
