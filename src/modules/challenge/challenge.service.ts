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

    const totalParticipants =
      challenge.teamsAmount * challenge.participantsPerTeam;

    if (count >= totalParticipants) {
      await this.startChallenge(challengeId);
    }

    return { name, team, participantId: data.id };
  }

  public async startChallenge(challengeId: string): Promise<void> {
    const supabase = this.db.getClient();

    const text = `
    The term "moral harassment" is often used to describe a type of {1}. Moral harassment is a form of {2} that is not specifically protected under the law, but can still be actionable if it rises to the level of creating a hostile {3}.
    Moral harassment can take many forms, but generally includes any type of {4} that is intended to humiliate, intimidate, or otherwise cause {5}. Examples of moral harassment may include {6} about someone's appearance or personal life, spreading rumors, or singling someone out for unfair {7}.
    `;
    const placeholders = [
      { word: 'work environment', position: 3 },
      { word: 'behavior', position: 4 },
      { word: 'workplace harassment', position: 2 },
      { word: 'emotional distress', position: 5 },
      { word: 'criticism', position: 7 },
      { word: 'workplace bullying', position: 1 },
      { word: 'making derogatory comments', position: 6 },
    ];

    const { data: challenge } = await supabase
      .from('challenges')
      .update({ text, placeholders, status: 'RUNNING' })
      .eq('id', challengeId)
      .select()
      .single();

    this.eventGateway.emitChallengeEvent(
      challengeId,
      'CHALLENGE_START',
      challenge,
    );
  }
}
