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
  userId: string;
  title: string;
  goal: string;
  alignmentWithLifeCareer: string;
  motivation: string;
  currentLevel: CurrentLevelEnum;
  expectedLevel: ExpectedLevelEnum;
  specificGoal: string;
  progressTrackingMethod: string;
  resources: string;
  developmentImpact: string;
  estimatedCompletionDate: Date;
  learningMethod: string;
  timeCommitment: number;
  knowledgeApplication: string;
  rewards: string;
  reviewCommitment: ReviewCommitmentEnum;
}
