import { ApiProperty } from '@nestjs/swagger';

export class CreateActionPlanResponse {
  @ApiProperty({
    description: 'Action plan unique identifier',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
  })
  id: string;
}
