import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Locale } from '../../generated/prisma/enums';

export class RegisterDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ enum: Locale, example: 'EN' })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;
}
