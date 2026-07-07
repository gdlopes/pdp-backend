import {
  CreateActionPlanDto,
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from '../../src/modules/action-plans/dto/create-action-plan.dto';
import { NON_EXISTENT_USER_ID } from '../users/mock';

export { NON_EXISTENT_USER_ID };
export const NON_EXISTENT_ACTION_PLAN_ID = 999999;

export const buildCreateActionPlanDto = (
  userId: string,
  overrides: Partial<CreateActionPlanDto> = {},
): CreateActionPlanDto => ({
  userId,
  title: 'Kubernetes',
  goal: 'To improve my knowledge.',
  alignmentWithLifeCareer:
    'It aligns with my goal of becoming a senior engineer.',
  motivation: 'I want to improve my skills for a new project at work.',
  currentLevel: CurrentLevelEnum.BEGINNER,
  expectedLevel: ExpectedLevelEnum.ENHANCE_CURRENT_LEVEL,
  specificGoal: 'Deploy and manage a Kubernetes cluster in production.',
  progressTrackingMethod:
    'By completing weekly labs and passing certification exams.',
  resources: 'Online courses, documentation, and a lab environment.',
  developmentImpact: 'It will enable me to lead cloud-native projects at work.',
  estimatedCompletionDate: new Date('2025-12-31'),
  learningMethod: 'Through hands-on practice and online courses.',
  timeCommitment: 3,
  knowledgeApplication: 'By implementing Kubernetes in my current project.',
  rewards: 'Take a weekend trip to celebrate.',
  reviewCommitment: ReviewCommitmentEnum.WEEKLY,
  ...overrides,
});
