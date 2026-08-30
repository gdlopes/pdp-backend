import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Identifier of the action plan this task belongs to.',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
    type: String,
    required: true,
  })
  actionPlanId: string;

  @ApiProperty({
    description: 'Task description.',
    example: 'Complete the Kubernetes introductory course.',
    type: String,
    required: true,
  })
  description: string;
}
