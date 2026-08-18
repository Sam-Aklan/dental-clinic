import { ApiProperty } from '@nestjs/swagger';

export class KioskTokenResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  doctorId!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty()
  lobbyUrl!: string;
}
