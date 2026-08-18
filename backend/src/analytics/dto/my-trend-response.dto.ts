import { ApiProperty } from '@nestjs/swagger';

export class MyTrendResponseDto {
  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty()
  dayLabel!: string;

  @ApiProperty()
  count!: number;
}
