import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // validation decorator가 없으면 아예 거름
      forbidNonWhitelisted: true, // validation decorator가 없는 값이 들어오면 error뱉음
      transform: true, // request를 우리가 원하는 실제 타입으로 변환해줌
    }),
  );
  await app.listen(3000);
}
bootstrap();
