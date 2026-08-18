import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Locale } from '../../generated/prisma/enums';

export class DoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  specialization: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: Locale })
  preferredLocale: Locale;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
