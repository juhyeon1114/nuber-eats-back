import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [UsersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }], // AuthGuard를 모든 resolver에 대해서 global하게 동작시킴
})
export class AuthModule {}
