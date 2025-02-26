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
  wordPosition: number;
  position: number;
};

type EventType =
  | 'CHALLENGE_START'
  | 'DRAG_START'
  | 'DRAG_MOVE'
  | 'DRAG_CANCEL'
  | 'DRAG_END'
  | 'REMOVE_ITEM'
  | 'CHALLENGE_END';

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
    event: EventType,
    payload: unknown,
  ) {
    this.websocket.emit(`challenge:${challengeId}`, { event, payload });
  }

  @SubscribeMessage('drag:start')
  public async handleEventOnDragStart(
    @MessageBody() { challengeId, participantId, wordPosition }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.addLock(challengeId, wordPosition);
    await this.#emitSnapshot('DRAG_START', { challengeId, participantId });
  }

  @SubscribeMessage('drag:cancel')
  public async handleEventOnDragCancel(
    @MessageBody() { challengeId, participantId, wordPosition }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.removeLock(challengeId, wordPosition);
    await this.#emitSnapshot('DRAG_CANCEL', {
      challengeId,
      participantId,
      wordPosition,
    });
  }

  @SubscribeMessage('drag:move')
  public handleEventOnDragMove(
    @MessageBody()
    data: Omit<EventPayload, 'position'> & { delta: { x: number; y: number } },
  ): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_MOVE', data);
  }

  @SubscribeMessage('drag:end')
  public async handleEventOnDragEnd(
    @MessageBody()
    { challengeId, participantId, wordPosition, position }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.addFilled(challengeId, {
      wordPosition,
      position,
    });
    await this.#emitSnapshot('DRAG_END', {
      challengeId,
      participantId,
      wordPosition,
    });
  }

  @SubscribeMessage('remove:item')
  public async handleEventOnRemoveItem(
    @MessageBody() { challengeId, position, participantId }: EventPayload,
  ): Promise<void> {
    await this.challengeStatusService.removeFilled(challengeId, position);
    await this.#emitSnapshot('REMOVE_ITEM', { challengeId, participantId });
  }

  @SubscribeMessage('submit')
  public async handleEventOnSubmit(
    @MessageBody()
    {
      challengeId,
      participantId,
    }: Pick<EventPayload, 'challengeId' | 'participantId'>,
  ): Promise<void> {
    await this.challengeStatusService.submit(challengeId);
    await this.#emitSnapshot('CHALLENGE_END', { challengeId, participantId });
  }

  async #emitSnapshot(
    event: EventType,
    {
      participantId,
      challengeId,
      wordPosition,
    }: { challengeId: string; participantId: string; wordPosition?: number },
  ): Promise<void> {
    const payload = await this.challengeStatusService.getSnapshot(challengeId);
    this.emitChallengeEvent(challengeId, event, {
      ...payload,
      participantId,
      wordPosition,
    });
  }
}
