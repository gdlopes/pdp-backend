import * as request from 'supertest';
import { ActionPlanStatusEnum } from '../../src/database/entities/action-plans.entity';
import { bearer } from '../shared/login';
import { buildCreateActionPlanDto } from './mock';
import { setupActionPlansE2E, teardownActionPlansE2E } from './setup';

describe('ActionPlans - POST /action-plans', () => {
  jest.setTimeout(120000);

  const context = setupActionPlansE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownActionPlansE2E(await context);
  });

  it('should create an action plan successfully', async () => {
    const { app, creatorAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send(buildCreateActionPlanDto());

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    const created = await request(app.getHttpServer())
      .get(`/action-plans/${response.body.id}`)
      .set(bearer(creatorAuth.accessToken));

    expect(created.status).toBe(200);
    expect(created.body.status).toBe(ActionPlanStatusEnum.NOT_STARTED);
    expect(created.body.title).toBe('Kubernetes');
    expect(created.body.specificGoal).toBeDefined();
    expect(created.body.successIndicator).toBeDefined();
    expect(created.body.rewards).toBeDefined();
  });

  it('should return 401 without a token', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .send(buildCreateActionPlanDto());

    expect(response.status).toBe(401);
  });

  it('should reject a spoofed userId in the body', async () => {
    const { app, creatorAuth, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send({ ...buildCreateActionPlanDto(), userId: ownerAuth.user.id });

    expect(response.status).toBe(400);
  });

  it('should reject a client-supplied status', async () => {
    const { app, creatorAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send({ ...buildCreateActionPlanDto(), status: 'COMPLETED' });

    expect(response.status).toBe(400);
  });

  it('should reject a dropped coaching field', async () => {
    const { app, creatorAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(creatorAuth.accessToken))
      .send({ ...buildCreateActionPlanDto(), goal: 'Improve my knowledge' });

    expect(response.status).toBe(400);
  });
});
