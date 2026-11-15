//import { NestFactory } from '@nestjs/core';
//import { AppModule } from './app.module';

//async function bootstrap() {
//  const app = await NestFactory.create(AppModule);
//  const port = process.env.PORT ?? 3001;
//  await app.listen(port);
//  console.log(`[doc-processor] Microservicio corriendo en http://localhost:${port}`);
//}
//bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`[doc-processor] Microservicio corriendo en http://0.0.0.0:${port}`);
}
bootstrap();