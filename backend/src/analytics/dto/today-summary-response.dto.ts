import { ApiProperty } from '@nestjs/swagger';

export class TodaySummaryResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  inProgress!: number;

  @ApiProperty()
  waiting!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  canceledToday!: number;

  @ApiProperty()
  noShow!: number;

  @ApiProperty()
  pendingConfirmation!: number;
}
