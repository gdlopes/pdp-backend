import { ApiProperty } from '@nestjs/swagger';

export class AuthUserResponseDto {
  @ApiProperty({ example: '283c9543-caff-47c9-8dc6-2b88c8cac634' })
  id: string;

  @ApiProperty({ example: 'peter-parker@email.com' })
  email: string;
}

export class AuthSessionResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token.' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    description: 'Access token lifetime in seconds.',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
