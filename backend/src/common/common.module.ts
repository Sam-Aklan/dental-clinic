import { Module, Global } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  providers: [
    Reflector,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    TransformInterceptor,
    HttpExceptionFilter,
  ],
  exports: [
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    TransformInterceptor,
    HttpExceptionFilter,
  ],
})
export class CommonModule {}
