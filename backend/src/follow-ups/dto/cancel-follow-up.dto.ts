import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelFollowUpDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  cancelReason!: string;
}
