import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
