import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { StorageModule } from './storage/storage.module';
import { MangasModule } from './mangas/mangas.module';
import { AuthModule } from './auth/auth.module';

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
})
export class AppModule {}
