import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../../generated/prisma/enums';

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Whether the completed appointment still needs a follow-up', nullable: true })
  @IsOptional()
  @IsBoolean()
  needsFollowUp?: boolean;
}
