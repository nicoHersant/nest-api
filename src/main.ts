import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── OpenAPI / Swagger ───────────────────────────────────────────────────

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MangaAPI')
    .setDescription(
      'API REST professionnelle servant des données de mangas.\n\n' +
        'Toutes les routes (sauf `/auth/register`) nécessitent le header `X-API-Key`.\n\n' +
        "Les routes d'écriture (POST/PUT/PATCH/DELETE sur `/mangas`) sont réservées aux comptes `admin`.",
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Spec JSON brute : GET /api/docs-json
  // UI Swagger classique (backup) : GET /api/swagger
  SwaggerModule.setup('api/swagger', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  // UI Scalar : GET /api/docs
  const { apiReference } = await import('@scalar/nestjs-api-reference');
  app.use('/api/docs', apiReference({ url: '/api/docs-json' }));

  // ────────────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3000);

  console.log(`\nMangaAPI running on  : http://localhost:3000/api`);
  console.log(`Documentation Scalar : http://localhost:3000/api/docs`);
  console.log(`Spec OpenAPI JSON    : http://localhost:3000/api/docs-json\n`);
}
bootstrap();
