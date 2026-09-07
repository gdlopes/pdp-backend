import * as request from 'supertest';
import { bearer } from '../shared/login';
import { NON_EXISTENT_ACTION_PLAN_ID } from './mock';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

describe('ActionPlans - GET /action-plans/:id', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  it('should return an action plan by id', async () => {
    const { app, ownerAuth, userWithActionPlans, seededActionPlan } =
      await context;

    const response = await request(app.getHttpServer())
      .get(`/action-plans/${seededActionPlan.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: seededActionPlan.id,
      userId: userWithActionPlans.id,
      title: seededActionPlan.title,
    });
  });

  it('should return not found when action plan does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .get(`/action-plans/${NON_EXISTENT_ACTION_PLAN_ID}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Action plan not found.');
  });

  it('should return not found when action plan belongs to another user', async () => {
    const { app, otherAuth, seededActionPlan } = await context;

    const response = await request(app.getHttpServer())
      .get(`/action-plans/${seededActionPlan.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Action plan not found.');
  });

  it('should return 401 without a token', async () => {
    const { app, seededActionPlan } = await context;

    const response = await request(app.getHttpServer()).get(
      `/action-plans/${seededActionPlan.id}`,
    );

    expect(response.status).toBe(401);
  });
});
