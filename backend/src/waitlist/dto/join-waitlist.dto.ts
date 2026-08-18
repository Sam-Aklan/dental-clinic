import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { WaitlistWindowPair } from './waitlist-window-pair.validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;
const HH_MM_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class JoinWaitlistDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;

  @ApiPropertyOptional({ nullable: true, pattern: HH_MM_REGEX.source })
  @WaitlistWindowPair()
  @IsOptional()
  @IsString()
  @Matches(HH_MM_REGEX)
  availableFrom?: string | null;

  @ApiPropertyOptional({ nullable: true, pattern: HH_MM_REGEX.source })
  @WaitlistWindowPair()
  @IsOptional()
  @IsString()
  @Matches(HH_MM_REGEX)
  availableUntil?: string | null;
}
