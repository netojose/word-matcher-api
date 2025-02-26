import { forwardRef, Module } from '@nestjs/common';

import { ChallengeModule } from '@/modules/challenge/challenge.module';

import { EventGateway } from './event.gateway';

@Module({
  imports: [forwardRef(() => ChallengeModule)],
  providers: [EventGateway],
  exports: [EventGateway],
})
export class EventModule {}
