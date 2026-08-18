import { ApiProperty } from '@nestjs/swagger';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';

export class MyTrendsQueryDto {
  @ApiProperty({ format: 'date' })
  @IsCalendarDate()
  week!: string;
}
