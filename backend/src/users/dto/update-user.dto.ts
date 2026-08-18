import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Locale, Role } from '../../generated/prisma/enums';

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Janet' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: '+1 555-100-2000', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.phone !== null)
  @IsString()
  @MaxLength(20)
  @Matches(phoneRegex)
  phone?: string | null;

  @ApiPropertyOptional({ enum: Role, example: Role.DOCTOR })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: Locale, example: Locale.AR })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @ApiPropertyOptional({ example: '1990-06-15', description: 'ISO date string', nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
