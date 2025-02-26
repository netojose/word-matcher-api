import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

type EventPayload = {
  challengeId: string;
  participantId: string;
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
  public handleEventOnDragStart(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_START', data);
  }

  @SubscribeMessage('drag:cancel')
  public handleEventOnDragCancel(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_CANCEL', data);
  }

  @SubscribeMessage('drag:move')
  public handleEventOnDragMove(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_MOVE', data);
  }

  @SubscribeMessage('drag:end')
  public handleEventOnDragEnd(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'DRAG_END', data);
  }

  @SubscribeMessage('remove:item')
  public handleEventOnRemoveItem(@MessageBody() data: EventPayload): void {
    this.emitChallengeEvent(data.challengeId, 'REMOVE_ITEM', data);
  }
}
