import { IsUUID, IsString, MaxLength } from 'class-validator';

export class JoinChallengeDto {
  @IsUUID()
  challengeId: string;

  @IsString()
  @MaxLength(30)
  name: string;
}
