import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateNotesDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
