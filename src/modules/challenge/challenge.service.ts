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
    P1: {1}, o capital mais importante é o P2: {2}. São pessoas de várias culturas, tradições, formações, naturezas e educações convivendo e vivendo juntas. A P3: {3}, portanto, é fundamental para o relacionamento e o desenvolvimento das atividades. Nesse cenário, então, devemos respeitar as diferenças existentes, já que muitas vezes passamos mais tempo com nossos colegas de trabalho do que com nossos P4: {4}.
    É muito comum, também, encontrarmos P5: {5} que fazem o funcionário ser menos produtivo por se preocupar mais com o outro do que com o seu P6: {6}. Em relação à segurança e meio ambiente é de suma importância que, além do respeito das normas e padrões da empresa, saibamos respeitar o P7: {7}.
    `;
    const placeholders = [
      { word: 'p3', position: 3 },
      { word: 'p4', position: 4 },
      { word: 'p2', position: 2 },
      { word: 'p5', position: 5 },
      { word: 'p7', position: 7 },
      { word: 'p1', position: 1 },
      { word: 'p6', position: 6 },
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
