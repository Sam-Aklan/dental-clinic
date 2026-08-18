import { ApiProperty } from '@nestjs/swagger';

export class AppointmentTrendResponseDto {
  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  confirmed!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  canceled!: number;

  @ApiProperty()
  noShow!: number;
}
