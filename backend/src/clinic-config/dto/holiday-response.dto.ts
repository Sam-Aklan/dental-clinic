import { ApiProperty } from '@nestjs/swagger';

export class HolidayResponseDto {
  @ApiProperty({ example: 'clxyz123' })
  id!: string;

  @ApiProperty({ example: '2026-12-25' })
  date!: string;

  @ApiProperty({ example: 'Christmas' })
  name!: string;

  @ApiProperty({ example: '2026-05-14T10:00:00.000Z' })
  createdAt!: string;
}
