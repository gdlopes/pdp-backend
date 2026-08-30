import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskResponseDto {
  @ApiProperty({
    description: 'Created task identifier.',
    example: '283c9543-caff-47c9-8dc6-2b88c8cac634',
  })
  id: string;
}
