import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChallengeModule } from '@/modules/challenge/challenge.module';
import { EventModule } from '@/modules/event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChallengeModule,
    EventModule,
  ],
})
export class AppModule {}
