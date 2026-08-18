import { ApiProperty } from '@nestjs/swagger';

export class StatusDistributionResponseDto {
  @ApiProperty()
  PENDING!: number;

  @ApiProperty()
  CONFIRMED!: number;

  @ApiProperty()
  IN_PROGRESS!: number;

  @ApiProperty()
  COMPLETED!: number;

  @ApiProperty()
  CANCELED!: number;

  @ApiProperty()
  NO_SHOW!: number;
}
