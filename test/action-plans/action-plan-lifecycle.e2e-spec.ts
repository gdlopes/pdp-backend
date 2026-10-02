import * as request from 'supertest';
import { ActionPlanStatusEnum } from '../../src/database/entities/action-plans.entity';
import { bearer } from '../shared/login';
import { buildCreateActionPlanDto, NON_EXISTENT_ACTION_PLAN_ID } from './mock';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

describe('ActionPlans - POST /action-plans/:id/start|complete|archive', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  const createPlan = async (
    app: Awaited<ReturnType<typeof setupActionPlansE2E>>['app'],
    token: string,
    title = 'Lifecycle plan',
  ) => {
    const created = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(token))
      .send(buildCreateActionPlanDto({ title }));
    return created.body.id;
  };

  it('should start a not-started plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Start plan');

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id,
      status: ActionPlanStatusEnum.IN_PROGRESS,
    });
  });

  it('should be idempotent when starting an in-progress plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Start twice');

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id,
      status: ActionPlanStatusEnum.IN_PROGRESS,
    });
  });

  it('should complete an in-progress plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Complete plan');

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id,
      status: ActionPlanStatusEnum.COMPLETED,
    });
  });

  it('should be idempotent when completing an already completed plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Complete twice');

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id,
      status: ActionPlanStatusEnum.COMPLETED,
    });
  });

  it('should not start a completed plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(
      app,
      creatorAuth.accessToken,
      'Start completed',
    );

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan is completed.');
  });

  it('should not complete a plan that has not been started', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Complete early');

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan has not been started.');
  });

  it('should archive a not-started plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Archive plan');

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id,
      status: ActionPlanStatusEnum.ARCHIVED,
    });
  });

  it('should archive a completed plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(
      app,
      creatorAuth.accessToken,
      'Archive completed',
    );

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ActionPlanStatusEnum.ARCHIVED);
  });

  it('should be idempotent when archiving an archived plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Archive twice');

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/action-plans/${id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(ActionPlanStatusEnum.ARCHIVED);
  });

  it('should not start or complete an archived plan', async () => {
    const { app, creatorAuth } = await context;
    const id = await createPlan(app, creatorAuth.accessToken, 'Frozen archive');

    await request(app.getHttpServer())
      .post(`/action-plans/${id}/archive`)
      .set(bearer(creatorAuth.accessToken));

    const start = await request(app.getHttpServer())
      .post(`/action-plans/${id}/start`)
      .set(bearer(creatorAuth.accessToken));
    const complete = await request(app.getHttpServer())
      .post(`/action-plans/${id}/complete`)
      .set(bearer(creatorAuth.accessToken));

    expect(start.status).toBe(400);
    expect(start.body.message).toEqual('Action plan is archived.');
    expect(complete.status).toBe(400);
    expect(complete.body.message).toEqual('Action plan is archived.');
  });

  it('should return 404 for missing or foreign plans', async () => {
    const { app, creatorAuth, otherAuth, seededActionPlan } = await context;

    const missing = await request(app.getHttpServer())
      .post(`/action-plans/${NON_EXISTENT_ACTION_PLAN_ID}/start`)
      .set(bearer(creatorAuth.accessToken));
    const foreign = await request(app.getHttpServer())
      .post(`/action-plans/${seededActionPlan.id}/complete`)
      .set(bearer(otherAuth.accessToken));

    expect(missing.status).toBe(404);
    expect(foreign.status).toBe(404);
    expect(missing.body.message).toEqual(foreign.body.message);
  });

  it('should return 401 without a token', async () => {
    const { app, seededActionPlan } = await context;

    const start = await request(app.getHttpServer()).post(
      `/action-plans/${seededActionPlan.id}/start`,
    );
    const complete = await request(app.getHttpServer()).post(
      `/action-plans/${seededActionPlan.id}/complete`,
    );
    const archive = await request(app.getHttpServer()).post(
      `/action-plans/${seededActionPlan.id}/archive`,
    );

    expect(start.status).toBe(401);
    expect(complete.status).toBe(401);
    expect(archive.status).toBe(401);
  });
});
