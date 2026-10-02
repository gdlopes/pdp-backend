import { CreateActionPlanDto } from '../../src/modules/action-plans/dto/create-action-plan.dto';
import { NON_EXISTENT_USER_ID } from '../users/mock';

export { NON_EXISTENT_USER_ID };
export const NON_EXISTENT_ACTION_PLAN_ID = 999999;

export const buildCreateActionPlanDto = (
  overrides: Partial<CreateActionPlanDto> = {},
): CreateActionPlanDto => ({
  title: 'Kubernetes',
  specificGoal: 'Deploy and manage a Kubernetes cluster in production.',
  deadline: new Date('2025-12-31'),
  resources: 'Online courses, documentation, and a lab environment.',
  successIndicator:
    'By completing weekly labs and passing certification exams.',
  rewards: 'Take a weekend trip to celebrate.',
  ...overrides,
});
