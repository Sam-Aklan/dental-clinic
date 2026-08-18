import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';

export class MyStatsQueryDto {
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsCalendarDate()
  date?: string;
}
