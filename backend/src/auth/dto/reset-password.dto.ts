import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123rawresettoken' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecurePass1' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'newPassword must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'newPassword must contain at least one digit' })
  newPassword: string;
}
