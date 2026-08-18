import { ApiProperty } from '@nestjs/swagger';

export class HourlyLoadResponseDto {
  @ApiProperty()
  hour!: number;

  @ApiProperty()
  count!: number;
}
