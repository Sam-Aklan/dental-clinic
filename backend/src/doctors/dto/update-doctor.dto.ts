import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Locale } from '../../generated/prisma/enums';

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'Sara' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: '+1 555-100-2000', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(20)
  @Matches(phoneRegex)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Orthodontics', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(120)
  specialization?: string | null;

  @ApiPropertyOptional({ example: 'Updated biography text.', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ enum: Locale, example: Locale.AR })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}
