import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { IsCalendarDate } from '../../common/decorators/is-calendar-date.decorator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class SlotsQueryDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;

  @ApiProperty({ format: 'date' })
  @IsCalendarDate()
  from!: string;

  @ApiProperty({ format: 'date' })
  @IsCalendarDate()
  to!: string;

  @ApiProperty({ required: false, default: false })
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  includeReserved?: boolean;
}
