import { ApiProperty } from '@nestjs/swagger';

export class WorkingHourResponseDto {
  @ApiProperty({ nullable: true, example: null })
  id!: string | null;

  @ApiProperty({ example: 0 })
  dayOfWeek!: number;

  @ApiProperty({ example: true })
  isClosed!: boolean;

  @ApiProperty({ example: null, nullable: true })
  startTime!: string | null;

  @ApiProperty({ example: null, nullable: true })
  endTime!: string | null;
}
