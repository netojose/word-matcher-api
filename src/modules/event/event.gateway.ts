import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { ChallengeStatusService } from '@/modules/challenge/challenge-status.service';

type EventPayload = {
  challengeId: string;
  participantId: string;
  word: number;
  position: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
})
@Injectable()
export class EventGateway {
  constructor(
    private readonly challengeStatusService: ChallengeStatusService,
  ) {}

  @WebSocketServer() websocket: Server;

  public emitChallengeEvent(
    challengeId: string,
    event:
      | 'CHALLENGE_START'
      | 'DRAG_START'
      | 'DRAG_MOVE'
      | 'DRAG_CANCEL'
      | 'DRAG_END'
      | 'REMOVE_ITEM'
      | 'CHALLENGE_END',
    payload: unknown,
  ) {
    this.websocket.emit(`challenge:${challengeId}`, { event, payload });
  }

  @SubscribeMessage('drag:start')
  public async handleEventOnDragStart(
    @MessageBody() { challengeId, participantId, word }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.addLock(challengeId, word);
    const payload = await this.challengeStatusService.getSnapshot(challengeId);
    this.emitChallengeEvent(challengeId, 'DRAG_START', {
      ...payload,
      participantId,
    });
  }

  @SubscribeMessage('drag:cancel')
  public async handleEventOnDragCancel(
    @MessageBody() { challengeId, participantId, word }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.removeLock(challengeId, word);
    const payload = await this.challengeStatusService.getSnapshot(challengeId);
    this.emitChallengeEvent(challengeId, 'DRAG_CANCEL', {
      ...payload,
      participantId,
    });
  }

  @SubscribeMessage('drag:move')
  public handleEventOnDragMove(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_MOVE', data);
  }

  @SubscribeMessage('drag:end')
  public async handleEventOnDragEnd(
    @MessageBody() { challengeId, participantId, word, position }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.addFilled(challengeId, {
      word,
      position,
    });
    const payload = await this.challengeStatusService.getSnapshot(challengeId);
    this.emitChallengeEvent(challengeId, 'DRAG_END', {
      ...payload,
      participantId,
    });
  }

  @SubscribeMessage('remove:item')
  public async handleEventOnRemoveItem(
    @MessageBody() { challengeId, position, participantId }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.removeFilled(challengeId, position);
    const payload = await this.challengeStatusService.getSnapshot(challengeId);
    this.emitChallengeEvent(challengeId, 'REMOVE_ITEM', {
      ...payload,
      participantId,
    });
  }
}
