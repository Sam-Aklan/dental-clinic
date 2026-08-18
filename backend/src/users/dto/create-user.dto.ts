import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Locale, Role } from '../../generated/prisma/enums';

const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/;

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@clinic.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional({ example: '+1 555-100-2000', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(phoneRegex)
  phone?: string;

  @ApiProperty({ enum: Role, example: Role.RECEPTIONIST })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ enum: Locale, example: Locale.EN })
  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;
}
