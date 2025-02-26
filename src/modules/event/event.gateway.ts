import { Tables } from '@/database.types';
import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  public emitStartChallenge(challenge: Tables<'challenges'>) {
    const channel = `start-challenge:${challenge.id}`;
    this.websocket.emit(channel, challenge);
  }

  @SubscribeMessage('onStartDrag')
  public handleEventOnStartDrag(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(client);
    return data;
  }

  @SubscribeMessage('onDrag')
  public handleEventOnDrag(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(client);
    return data;
  }

  @SubscribeMessage('onStopDrag')
  public handleEventOnStopDrag(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(client);
    return data;
  }
}
