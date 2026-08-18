import { ApiProperty } from '@nestjs/swagger';

export class FollowUpItemResponseDto {
  @ApiProperty()
  patientId!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty({ format: 'date' })
  lastAppointmentDate!: string;

  @ApiProperty()
  daysSince!: number;

  @ApiProperty()
  hasUpcoming!: boolean;
}

export class FollowUpResponseDto {
  @ApiProperty({ type: FollowUpItemResponseDto, isArray: true })
  items!: FollowUpItemResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;
}
