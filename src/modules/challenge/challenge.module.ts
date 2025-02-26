import { Module } from '@nestjs/common';
import { DbModule } from '@/modules/db/db.module';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { EventModule } from '@/modules/event/event.module';

@Module({
  imports: [DbModule, EventModule],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}
