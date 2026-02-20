import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    StorageModule,
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
