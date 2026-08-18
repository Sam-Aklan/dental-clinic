import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { FollowUpStatus } from '../../generated/prisma/enums';

export class UpdateFollowUpStatusDto {
  @ApiProperty({ enum: [FollowUpStatus.COMPLETED, FollowUpStatus.CANCELED, FollowUpStatus.MISSED] })
  @IsIn([FollowUpStatus.COMPLETED, FollowUpStatus.CANCELED, FollowUpStatus.MISSED])
  status!: FollowUpStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
