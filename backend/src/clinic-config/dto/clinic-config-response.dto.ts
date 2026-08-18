import { ApiProperty } from '@nestjs/swagger';

export class ClinicConfigResponseDto {
  @ApiProperty({ example: 'clinic-config-singleton' })
  id!: string;

  @ApiProperty({ example: 30 })
  slotDurationMinutes!: number;

  @ApiProperty({ example: 'UTC' })
  timeZone!: string;

  @ApiProperty({ example: 24 })
  reminderHoursBefore!: number;

  @ApiProperty({ example: 30 })
  offerWindowMinutes!: number;

  @ApiProperty({ example: 45 })
  minArrivalMinutes!: number;

  @ApiProperty({ example: '2026-05-14T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-14T11:00:00.000Z' })
  updatedAt!: string;
}
