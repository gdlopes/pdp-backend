import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User e-mail.',
    example: 'peter-parker@email.com',
    type: String,
    required: true,
  })
  email: string;

  @ApiProperty({
    description: 'User password.',
    type: String,
    required: true,
  })
  password: string;
}
