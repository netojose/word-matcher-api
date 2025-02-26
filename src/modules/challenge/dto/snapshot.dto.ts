import { FilledDto } from './filled.dto';

export class SnapshotDto {
  locks: number[];
  filled: FilledDto[];
}
