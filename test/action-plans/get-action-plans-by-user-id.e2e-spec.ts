import * as request from 'supertest';
import { ActionPlanStatusEnum } from '../../src/database/entities/action-plans.entity';
import { bearer } from '../shared/login';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

const expectPlanShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.anything(),
      userId: expect.anything(),
      title: expect.any(String),
      specificGoal: expect.any(String),
      deadline: expect.any(String),
      resources: expect.any(String),
      successIndicator: expect.any(String),
      rewards: expect.any(String),
      status: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }),
  );
  expect(body).not.toHaveProperty('goal');
  expect(body).not.toHaveProperty('alignmentWithLifeCareer');
  expect(body).not.toHaveProperty('currentLevel');
};

describe('ActionPlans - GET /action-plans', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  it('should return action plans for the authenticated user', async () => {
    const { app, ownerAuth, seededActionPlan, userWithActionPlans } =
      await context;

    const response = await request(app.getHttpServer())
      .get('/action-plans')
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expectPlanShape(response.body[0]);
    expect(response.body[0]).toMatchObject({
      id: seededActionPlan.id,
      userId: userWithActionPlans.id,
      title: seededActionPlan.title,
      specificGoal: seededActionPlan.specificGoal,
      resources: seededActionPlan.resources,
      successIndicator: seededActionPlan.successIndicator,
      rewards: seededActionPlan.rewards,
      status: ActionPlanStatusEnum.NOT_STARTED,
    });
  });

  it('should return an empty array when the user has no action plans', async () => {
    const { app, otherAuth } = await context;

    const response = await request(app.getHttpServer())
      .get('/action-plans')
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should not return another user plans even if userId is queried', async () => {
    const { app, otherAuth, userWithActionPlans } = await context;

    const response = await request(app.getHttpServer())
      .get(`/action-plans?userId=${userWithActionPlans.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 401 without a token', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).get('/action-plans');

    expect(response.status).toBe(401);
  });
});
