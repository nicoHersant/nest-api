import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { StorageModule } from './storage/storage.module';
import { MangasModule } from './mangas/mangas.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';

@Module({
  imports: [
    StorageModule,
    MangasModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000, // 1 minute en ms
          limit: 100,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    // ThrottlerGuard appliqué globalement en premier
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ApiKeyGuard appliqué globalement en second
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
