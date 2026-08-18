import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-25' })
  @IsCalendarDate({ message: 'date must match YYYY-MM-DD format' })
  date!: string;

  @ApiProperty({ example: 'Christmas' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/\S/, { message: 'name must contain at least one non-whitespace character' })
  name!: string;
}
