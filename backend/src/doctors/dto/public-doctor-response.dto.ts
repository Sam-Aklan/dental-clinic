import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicDoctorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  specialization: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiProperty()
  isActive: boolean;
}
