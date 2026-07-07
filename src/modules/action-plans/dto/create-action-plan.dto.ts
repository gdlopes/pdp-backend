import { ApiProperty } from '@nestjs/swagger';

export enum CurrentLevelEnum {
  BEGINNER = 'BEGINNER',
  INTERMEDIARY = 'INTERMEDIARY',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum ExpectedLevelEnum {
  ENHANCE_CURRENT_LEVEL = 'ENHANCE_CURRENT_LEVEL',
  INTERMEDIARY = 'INTERMEDIARY',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum ReviewCommitmentEnum {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateActionPlanDto {
  @ApiProperty({
    description: 'Identifier to the owner of this action plan.',
    example: '6481dfe7-c581-4bf9-8df3-4d0475fe6a17',
    type: String,
    required: true,
  })
  userId: string;

  @ApiProperty({
    description: 'Action plan title.',
    example: 'Kubernetes',
    type: String,
    required: true,
  })
  title: string;

  @ApiProperty({
    description: 'Action plan main goal.',
    example: 'To improve my knowledge.',
    type: String,
    required: true,
  })
  goal: string;

  @ApiProperty({
    description: 'How does this goal align with your career or personal life?',
    example: 'It aligns with my goal of becoming a senior engineer.',
    type: String,
    required: true,
  })
  alignmentWithLifeCareer: string;

  @ApiProperty({
    description: 'What is the main motivation for seeking this knowledge?',
    example: 'I want to improve my skills for a new project at work.',
    type: String,
    required: true,
  })
  motivation: string;

  @ApiProperty({
    description:
      'What is your current level of knowledge or skill in this area?',
    enum: CurrentLevelEnum,
    example: CurrentLevelEnum.BEGINNER,
    required: true,
  })
  currentLevel: CurrentLevelEnum;

  @ApiProperty({
    description:
      'To what level of knowledge do you think this plan can take you?',
    enum: ExpectedLevelEnum,
    example: ExpectedLevelEnum.INTERMEDIARY,
    required: true,
  })
  expectedLevel: ExpectedLevelEnum;

  @ApiProperty({
    description: 'What exactly do you want to achieve?',
    example: 'Deploy and manage a Kubernetes cluster in production.',
    type: String,
    required: true,
  })
  specificGoal: string;

  @ApiProperty({
    description: `How will you know you're making progress?`,
    example: 'By completing weekly labs and passing certification exams.',
    type: String,
    required: true,
  })
  progressTrackingMethod: string;

  @ApiProperty({
    description: 'What resources do you have available for this development?',
    example: 'Online courses, documentation, and a lab environment.',
    type: String,
    required: true,
  })
  resources: string;

  @ApiProperty({
    description: 'How will this development help your career or personal life?',
    example: 'It will enable me to lead cloud-native projects at work.',
    type: String,
    required: true,
  })
  developmentImpact: string;

  @ApiProperty({
    description: 'What is the projected date for achieving this goal?',
    example: '2025-12-31',
    type: String,
    format: 'date',
    required: true,
  })
  estimatedCompletionDate: Date;

  @ApiProperty({
    description: 'How do you plan to learn this skill?',
    example: 'Through hands-on practice and online courses.',
    type: String,
    required: true,
  })
  learningMethod: string;

  @ApiProperty({
    description: 'How many days a week do you plan to dedicate to development?',
    example: 3,
    type: Number,
    required: true,
  })
  timeCommitment: number;

  @ApiProperty({
    description: 'How will you apply the knowledge you have acquired?',
    example: 'By implementing Kubernetes in my current project.',
    type: String,
    required: true,
  })
  knowledgeApplication: string;

  @ApiProperty({
    description:
      'How do you plan to reward yourself when you achieve your goal?',
    example: 'Take a weekend trip to celebrate.',
    type: String,
    required: true,
  })
  rewards: string;

  @ApiProperty({
    description: 'How often will you review and adjust your plan as needed?',
    enum: ReviewCommitmentEnum,
    example: ReviewCommitmentEnum.WEEKLY,
    required: true,
  })
  reviewCommitment: ReviewCommitmentEnum;
}
