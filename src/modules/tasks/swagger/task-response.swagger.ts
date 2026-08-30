import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusEnum } from '../../../database/entities/tasks.entity';

export class TaskResponse {
  @ApiProperty({
    description: 'Task unique identifier.',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
  })
  id: string;

  @ApiProperty({
    description: 'Identifier of the action plan this task belongs to.',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
  })
  actionPlanId: string;

  @ApiProperty({
    description: 'Task description.',
    example: 'Complete the Kubernetes introductory course.',
  })
  description: string;

  @ApiProperty({
    description: 'Current task status.',
    enum: TaskStatusEnum,
    example: TaskStatusEnum.NOT_STARTED,
  })
  status: TaskStatusEnum;

  @ApiProperty({
    description: 'Date when the task was created.',
    example: '2025-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the task was last updated.',
    example: '2025-01-20T14:45:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
