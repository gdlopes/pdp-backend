import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateActionPlanDto } from './create-action-plan.dto';

const validBody = {
  title: 'Kubernetes',
  specificGoal: 'Deploy a cluster in production',
  deadline: '2025-12-31',
  resources: 'Courses and documentation',
  successIndicator: 'Weekly labs',
  rewards: 'Weekend trip',
};

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const transform = (value: Record<string, unknown>) =>
  pipe.transform(value, { type: 'body', metatype: CreateActionPlanDto });

describe('CreateActionPlanDto', () => {
  it('accepts the six required fields', async () => {
    const result = (await transform(validBody)) as CreateActionPlanDto;

    expect(result.title).toBe(validBody.title);
    expect(result.specificGoal).toBe(validBody.specificGoal);
    expect(result.resources).toBe(validBody.resources);
    expect(result.successIndicator).toBe(validBody.successIndicator);
    expect(result.rewards).toBe(validBody.rewards);
    expect(result.deadline).toBeInstanceOf(Date);
  });

  it('rejects a client-supplied status', async () => {
    await expect(
      transform({ ...validBody, status: 'COMPLETED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a dropped coaching field', async () => {
    await expect(
      transform({ ...validBody, goal: 'Improve my knowledge' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
