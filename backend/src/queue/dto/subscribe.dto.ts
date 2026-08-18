import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const CUID_REGEX = /^[a-z0-9]{25}$/i;

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  @Matches(CUID_REGEX)
  doctorId!: string;
}
