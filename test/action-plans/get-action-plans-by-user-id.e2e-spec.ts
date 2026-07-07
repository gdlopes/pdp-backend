import * as request from 'supertest';
import { NON_EXISTENT_USER_ID } from './mock';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

describe('ActionPlans - GET /action-plans/:userId', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  it('should return action plans for a given user', async () => {
    const { app, userWithActionPlans, seededActionPlan } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/${userWithActionPlans.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: seededActionPlan.id,
      userId: userWithActionPlans.id,
      title: seededActionPlan.title,
    });
  });

  it('should return an empty array when user has no action plans', async () => {
    const { app, userWithoutActionPlans } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/${userWithoutActionPlans.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return error when user does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/${NON_EXISTENT_USER_ID}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('User does not exists.');
  });
});
