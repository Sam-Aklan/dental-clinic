import { ApiProperty } from '@nestjs/swagger';

export class DoctorUtilizationResponseDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  bookedSlots!: number;

  @ApiProperty()
  totalSlots!: number;

  @ApiProperty({ type: Number, format: 'float' })
  utilizationPct!: number;
}
