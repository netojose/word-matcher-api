import { Tables } from '@/database.types';

export class ChallengeDto {
  name: Tables<'challenges'>['name'];
  teamsAmount: Tables<'challenges'>['teamsAmount'];
  status: Tables<'challenges'>['status'];
  createdAt: Tables<'challenges'>['createdAt'];
  id: Tables<'challenges'>['id'];
}

export class ChallengeDetailDto {
  id: Tables<'challengeParticipants'>['id'];
  name: Tables<'challengeParticipants'>['name'];
  team: Tables<'challengeParticipants'>['team'];
  challenges: ChallengeDto;
}
