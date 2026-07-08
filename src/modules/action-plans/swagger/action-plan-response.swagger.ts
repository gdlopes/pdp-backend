import { ApiProperty } from '@nestjs/swagger';
import {
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from '../dto/create-action-plan.dto';

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
    description: 'Action plan main goal',
    example: 'To improve my knowledge.',
  })
  goal: string;

  @ApiProperty({
    description: 'How this goal aligns with career or personal life',
    example: 'It aligns with my goal of becoming a senior engineer.',
  })
  alignmentWithLifeCareer: string;

  @ApiProperty({
    description: 'Main motivation for seeking this knowledge',
    example: 'I want to improve my skills for a new project at work.',
  })
  motivation: string;

  @ApiProperty({
    description: 'Current level of knowledge or skill in this area',
    enum: CurrentLevelEnum,
    example: CurrentLevelEnum.BEGINNER,
  })
  currentLevel: CurrentLevelEnum;

  @ApiProperty({
    description: 'Expected level of knowledge this plan can achieve',
    enum: ExpectedLevelEnum,
    example: ExpectedLevelEnum.INTERMEDIARY,
  })
  expectedLevel: ExpectedLevelEnum;

  @ApiProperty({
    description: 'Specific achievement goal',
    example: 'Deploy and manage a Kubernetes cluster in production.',
  })
  specificGoal: string;

  @ApiProperty({
    description: 'Method for tracking progress',
    example: 'By completing weekly labs and passing certification exams.',
  })
  progressTrackingMethod: string;

  @ApiProperty({
    description: 'Available resources for this development',
    example: 'Online courses, documentation, and a lab environment.',
  })
  resources: string;

  @ApiProperty({
    description: 'Expected impact on career or personal life',
    example: 'It will enable me to lead cloud-native projects at work.',
  })
  developmentImpact: string;

  @ApiProperty({
    description: 'Projected date for achieving this goal',
    example: '2025-12-31T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  estimatedCompletionDate: Date;

  @ApiProperty({
    description: 'Planned learning method',
    example: 'Through hands-on practice and online courses.',
  })
  learningMethod: string;

  @ApiProperty({
    description: 'Number of days per week dedicated to development',
    example: 3,
  })
  timeCommitment: number;

  @ApiProperty({
    description: 'How the acquired knowledge will be applied',
    example: 'By implementing Kubernetes in my current project.',
  })
  knowledgeApplication: string;

  @ApiProperty({
    description: 'Planned reward upon achieving the goal',
    example: 'Take a weekend trip to celebrate.',
  })
  rewards: string;

  @ApiProperty({
    description: 'Frequency for reviewing and adjusting the plan',
    enum: ReviewCommitmentEnum,
    example: ReviewCommitmentEnum.WEEKLY,
  })
  reviewCommitment: ReviewCommitmentEnum;

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
