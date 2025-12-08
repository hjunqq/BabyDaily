import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 自动移除 DTO 中未定义的属性
    forbidNonWhitelisted: true, // 如果有未定义的属性，抛出错误
    transform: true, // 自动转换类型
  }));

  // 启用全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new BusinessExceptionFilter());

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('BabyDaily API')
    .setDescription('BabyDaily 后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 静态文件（上传）
  app.use('/uploads', express.static(join(__dirname, '..', '..', 'uploads')));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
