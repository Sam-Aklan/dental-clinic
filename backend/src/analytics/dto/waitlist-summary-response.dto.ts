import { ApiProperty } from '@nestjs/swagger';

export class WaitlistSummaryByDoctorDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  count!: number;
}

export class WaitlistSummaryResponseDto {
  @ApiProperty()
  totalActive!: number;

  @ApiProperty({ type: WaitlistSummaryByDoctorDto, isArray: true })
  byDoctor!: WaitlistSummaryByDoctorDto[];
}
