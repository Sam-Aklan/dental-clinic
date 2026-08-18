import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass1' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass2' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  newPassword: string;
}
