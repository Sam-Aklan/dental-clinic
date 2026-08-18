import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale, Role } from '../../generated/prisma/enums';

export class UserPatientProfileDto {
  @ApiPropertyOptional({ example: '1990-06-15', nullable: true })
  dateOfBirth: string | null;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: Locale })
  preferredLocale: Locale;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ example: '2026-05-14T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-05-14T10:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ type: UserPatientProfileDto, nullable: true })
  patientProfile?: UserPatientProfileDto | null;
}
