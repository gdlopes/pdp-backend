import * as request from 'supertest';
import { bearer } from '../shared/login';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

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
    expect(response.body[0]).toMatchObject({
      id: seededActionPlan.id,
      userId: userWithActionPlans.id,
      title: seededActionPlan.title,
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
