import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusEnum } from '../../../database/entities/tasks.entity';

export class TaskStatusResponseDto {
  @ApiProperty({
    description: 'Task identifier.',
    example: '283c9543-caff-47c9-8dc6-2b88c8cac634',
  })
  id: string;

  @ApiProperty({
    description: 'Current task status.',
    enum: TaskStatusEnum,
    example: TaskStatusEnum.IN_PROGRESS,
  })
  status: TaskStatusEnum;
}
