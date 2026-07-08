import * as request from 'supertest';
import { NON_EXISTENT_ACTION_PLAN_ID, NON_EXISTENT_USER_ID } from './mock';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

describe('ActionPlans - GET /action-plans/user/:userId/:id', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  it('should return an action plan by id', async () => {
    const { app, userWithActionPlans, seededActionPlan } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/user/${userWithActionPlans.id}/${seededActionPlan.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: seededActionPlan.id,
      userId: userWithActionPlans.id,
      title: seededActionPlan.title,
    });
  });

  it('should return not found when action plan does not exist', async () => {
    const { app, userWithActionPlans } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/user/${userWithActionPlans.id}/${NON_EXISTENT_ACTION_PLAN_ID}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual(
      `Action plan not found for user ${userWithActionPlans.id}.`,
    );
  });

  it('should return not found when action plan belongs to another user', async () => {
    const { app, userWithoutActionPlans, seededActionPlan } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/user/${userWithoutActionPlans.id}/${seededActionPlan.id}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual(
      `Action plan not found for user ${userWithoutActionPlans.id}.`,
    );
  });

  it('should return error when user does not exist', async () => {
    const { app, seededActionPlan } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/user/${NON_EXISTENT_USER_ID}/${seededActionPlan.id}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('User does not exists.');
  });
});
