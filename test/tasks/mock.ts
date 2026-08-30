import { CreateTaskDto } from '../../src/modules/tasks/dto/create-task.dto';

export const NON_EXISTENT_ACTION_PLAN_ID = '999999';
export const NON_EXISTENT_TASK_ID = '11111111-1111-1111-1111-111111111111';

export const buildCreateTaskDto = (
  actionPlanId: string,
  overrides: Partial<CreateTaskDto> = {},
): CreateTaskDto => ({
  actionPlanId,
  description: 'Complete the Kubernetes introductory course.',
  ...overrides,
});
