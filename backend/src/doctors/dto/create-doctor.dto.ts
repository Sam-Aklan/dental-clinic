import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Locale } from '../../generated/prisma/enums';

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export class CreateDoctorDto {
  @ApiProperty({ example: 'dr.sara@clinic.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sara' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;

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

  @ApiPropertyOptional({ example: 'Focuses on braces and alignment.', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ enum: Locale, example: Locale.EN })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;
}
