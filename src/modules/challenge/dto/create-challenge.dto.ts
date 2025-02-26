import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  userName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  challengeName: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  teamsAmount: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  participantsPerTeam: number;
}
