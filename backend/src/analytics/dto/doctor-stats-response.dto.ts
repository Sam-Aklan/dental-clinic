import { ApiProperty } from '@nestjs/swagger';

export class DoctorStatsResponseDto {
  @ApiProperty()
  todayTotal!: number;

  @ApiProperty()
  completedToday!: number;

  @ApiProperty()
  remainingToday!: number;

  @ApiProperty()
  inSession!: number;

  @ApiProperty()
  noShowsToday!: number;

  @ApiProperty()
  weekTotal!: number;
}
