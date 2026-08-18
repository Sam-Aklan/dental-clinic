import { ApiProperty } from '@nestjs/swagger';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';

export class DateRangeQueryDto {
  @ApiProperty({ format: 'date' })
  @IsCalendarDate()
  from!: string;

  @ApiProperty({ format: 'date' })
  @IsCalendarDate()
  to!: string;
}
