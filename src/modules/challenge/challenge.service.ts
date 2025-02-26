import { Injectable, NotFoundException } from '@nestjs/common';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { DbService } from '@/modules/db/db.service';
import { Tables } from '@/database.types';
import { JoinResponseDto } from './dto/join-response.dto';
import { EventGateway } from '@/modules/event/event.gateway';

@Injectable()
export class ChallengeService {
  constructor(
    private readonly db: DbService,
    private readonly eventGateway: EventGateway,
  ) {}

  public async create({
    name,
    teamsAmount,
    participantsPerTeam,
  }: {
    name: string;
    teamsAmount: number;
    participantsPerTeam: number;
  }): Promise<Tables<'challenges'>> {
    const supabase = this.db.getClient();

    const { data } = await supabase
      .from('challenges')
      .insert({ name, teamsAmount, participantsPerTeam, status: 'AVAILABLE' })
      .select()
      .single();

    return data;
  }

  public async getDetailByParticipantId(participantId: string): Promise<{
    id: string;
    name: string;
    team: number;
    challenges: Tables<'challenges'>;
  }> {
    const supabase = this.db.getClient();

    const { data } = await supabase
      .from('challengeParticipants')
      .select(
        `
        id,
        name,
        team,
        challenges (
          id,
          name,
          teamsAmount,
          participantsPerTeam,
          status,
          text,
          placeholders,
          createdAt
        )
      `,
      )
      .eq('id', participantId)
      .single();

    return data;
  }

  public async join({
    challengeId,
    name,
  }: JoinChallengeDto): Promise<JoinResponseDto> {
    const supabase = this.db.getClient();

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      throw new NotFoundException();
    }

    if (challenge.status !== 'AVAILABLE') {
      throw new NotFoundException();
    }

    const { data: teamCount } = await supabase
      .from('teamcountmembers')
      .select('*')
      .eq('challengeId', challengeId)
      .order('qty', { ascending: true })
      .order('team', { ascending: true })
      .limit(1)
      .single();

    const team = teamCount?.team ?? 1;

    const { data } = await supabase
      .from('challengeParticipants')
      .insert({ name, challengeId, team })
      .select()
      .single();

    const { count } = await supabase
      .from('challengeParticipants')
      .select('*', { count: 'exact', head: true })
      .eq('challengeId', challengeId);

    if (count >= challenge.teamsAmount * challenge.participantsPerTeam) {
      await this.startChallenge(challengeId);
    }

    return { name, team, participantId: data.id };
  }

  public async startChallenge(challengeId: string): Promise<void> {
    const supabase = this.db.getClient();

    const text = 'Some long text here';
    const placeholders = { foo: 'bar' };

    const { data: challenge } = await supabase
      .from('challenges')
      .update({ text, placeholders, status: 'RUNNING' })
      .eq('id', challengeId)
      .select()
      .single();

    this.eventGateway.emitStartChallenge(challenge);
  }
}
