import { json, urlencoded, text } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true }));
  app.use(text({ type: '*/json' }));

  await app.listen(3000);
}
void bootstrap();
