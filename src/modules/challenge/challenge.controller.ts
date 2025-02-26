import { Controller, Post, Body, Get, Param } from '@nestjs/common';

import { ChallengeService } from './challenge.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { ChallengeDetailDto } from './dto/challenge.dto';
import { JoinResponseDto } from './dto/join-response.dto';

@Controller('challenge')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Post()
  async create(@Body() data: CreateChallengeDto): Promise<JoinResponseDto> {
    const challenge = await this.challengeService.create({
      name: data.challengeName,
      participantsPerTeam: data.participantsPerTeam,
      teamsAmount: data.teamsAmount,
    });

    return await this.challengeService.join({
      challengeId: challenge.id,
      name: data.userName,
    });
  }

  @Post('join')
  join(@Body() data: JoinChallengeDto): Promise<JoinResponseDto> {
    return this.challengeService.join(data);
  }

  @Get('detail/:participantId')
  public async detail(
    @Param('participantId') participantId: string,
  ): Promise<ChallengeDetailDto> {
    return this.challengeService.getDetailByParticipantId(participantId);
  }
}
