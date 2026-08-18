import { ApiProperty } from '@nestjs/swagger';

export class AvailableSlotResponseDto {
  @ApiProperty({ format: 'date-time' })
  startsAt!: string;

  @ApiProperty({ format: 'date-time' })
  endsAt!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty({ enum: ['available', 'reserved'] })
  status!: 'available' | 'reserved';
}
