import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from '@/modules/db/db.module';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { EventModule } from '@/modules/event/event.module';
import { ChallengeStatusService } from './challenge-status.service';

@Module({
  imports: [DbModule, forwardRef(() => EventModule)],
  controllers: [ChallengeController],
  providers: [ChallengeService, ChallengeStatusService],
  exports: [ChallengeStatusService],
})
export class ChallengeModule {}
