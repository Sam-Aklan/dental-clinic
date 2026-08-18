import { ApiProperty } from '@nestjs/swagger';

export class CancellationTrendResponseDto {
  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty()
  canceledByPatient!: number;

  @ApiProperty()
  canceledByStaff!: number;

  @ApiProperty()
  noShow!: number;
}
