import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User e-mail.',
    example: 'peter-parker@email.com',
    type: String,
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password.',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
