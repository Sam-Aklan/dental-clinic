import { ApiProperty } from '@nestjs/swagger';

export class TodayByDoctorResponseDto {
  @ApiProperty()
  doctorId!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  confirmed!: number;

  @ApiProperty()
  inProgress!: number;

  @ApiProperty()
  completed!: number;

  @ApiProperty()
  canceled!: number;
}
