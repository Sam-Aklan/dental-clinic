import { ApiProperty } from '@nestjs/swagger';

export class KpiSummaryResponseDto {
  @ApiProperty()
  totalAppointments!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty({ type: Number, format: 'float' })
  cancellationRate!: number;

  @ApiProperty({ type: Number, format: 'float' })
  noShowRate!: number;

  @ApiProperty()
  activePatients!: number;

  @ApiProperty()
  waitlistSize!: number;

  @ApiProperty({ type: Number, format: 'float' })
  deltaTotalPct!: number;

  @ApiProperty({ type: Number, format: 'float' })
  deltaCompletedPct!: number;
}
