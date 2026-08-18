import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleOverrideResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  isUnavailable: boolean;

  @ApiPropertyOptional({ nullable: true })
  startTime: string | null;

  @ApiPropertyOptional({ nullable: true })
  endTime: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason: string | null;

  @ApiProperty()
  createdAt: string;
}
