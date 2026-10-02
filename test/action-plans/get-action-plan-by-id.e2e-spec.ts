import * as request from 'supertest';
import { ActionPlanStatusEnum } from '../../src/database/entities/action-plans.entity';
import { bearer } from '../shared/login';
import { buildCreateActionPlanDto, NON_EXISTENT_ACTION_PLAN_ID } from './mock';
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
      specificGoal: seededActionPlan.specificGoal,
      resources: seededActionPlan.resources,
      successIndicator: seededActionPlan.successIndicator,
      rewards: seededActionPlan.rewards,
      status: ActionPlanStatusEnum.NOT_STARTED,
    });
    expect(response.body.deadline).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
    expect(response.body).not.toHaveProperty('goal');
  });

  it('should return a completed plan', async () => {
    const { app, creatorAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send(buildCreateActionPlanDto());

    await request(app.getHttpServer())
      .post(`/action-plans/${created.body.id}/start`)
      .set(bearer(creatorAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/action-plans/${created.body.id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .get(`/action-plans/${created.body.id}`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ActionPlanStatusEnum.COMPLETED);
  });

  it('should return an archived plan', async () => {
    const { app, creatorAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send(buildCreateActionPlanDto({ title: 'Archive get' }));

    await request(app.getHttpServer())
      .post(`/action-plans/${created.body.id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .get(`/action-plans/${created.body.id}`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ActionPlanStatusEnum.ARCHIVED);
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
