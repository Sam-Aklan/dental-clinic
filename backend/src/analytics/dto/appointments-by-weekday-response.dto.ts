import { ApiProperty } from '@nestjs/swagger';

export class AppointmentsByWeekdayResponseDto {
  @ApiProperty()
  dayOfWeek!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  count!: number;
}
