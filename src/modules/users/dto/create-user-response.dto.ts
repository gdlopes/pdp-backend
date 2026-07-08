import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponseDto {
  @ApiProperty({
    example: '283c9543-caff-47c9-8dc6-2b88c8cac634',
  })
  id: string;

  @ApiProperty({
    example: 'peter-parker@email.com',
  })
  email: string;
}
