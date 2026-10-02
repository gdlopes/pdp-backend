import { ApiProperty } from '@nestjs/swagger';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';

export class ActionPlanResponse {
  @ApiProperty({
    description: 'Action plan unique identifier',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
  })
  id: string;

  @ApiProperty({
    description: 'Identifier of the owner of this action plan',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
  })
  userId: string;

  @ApiProperty({
    description: 'Action plan title',
    example: 'Kubernetes',
  })
  title: string;

  @ApiProperty({
    description: 'Specific outcome or result to achieve',
    example: 'Deploy and manage a Kubernetes cluster in production.',
  })
  specificGoal: string;

  @ApiProperty({
    description: 'Target completion date for the plan',
    example: '2025-12-31T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  deadline: Date;

  @ApiProperty({
    description: 'Tools, skills, budget, or support needed',
    example: 'Online courses, documentation, and a lab environment.',
  })
  resources: string;

  @ApiProperty({
    description: 'How progress is measured and what proves the goal is done',
    example: 'Weekly labs completed; CKA exam passed.',
  })
  successIndicator: string;

  @ApiProperty({
    description: 'Reward for completing the plan',
    example: 'Take a weekend trip to celebrate.',
  })
  rewards: string;

  @ApiProperty({
    description: 'Current action plan lifecycle status',
    enum: ActionPlanStatusEnum,
    example: ActionPlanStatusEnum.NOT_STARTED,
  })
  status: ActionPlanStatusEnum;

  @ApiProperty({
    description: 'Date when the action plan was created',
    example: '2025-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the action plan was last updated',
    example: '2025-01-20T14:45:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
