import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { ChallengeModule } from '@/modules/challenge/challenge.module';
import { EventModule } from '@/modules/event/event.module';

const ONE_DAY = 86400000;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: ONE_DAY }),
    ChallengeModule,
    EventModule,
  ],
})
export class AppModule {}
