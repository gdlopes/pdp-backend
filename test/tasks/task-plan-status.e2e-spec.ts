import * as request from 'supertest';
import { ActionPlanStatusEnum } from '../../src/database/entities/action-plans.entity';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
import { buildCreateActionPlanDto } from '../action-plans/mock';
import { bearer } from '../shared/login';
import { buildCreateTaskDto } from './mock';
import { setupTasksE2E, teardownTasksE2E } from './setup';

describe('Tasks - parent action plan status', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  const createPlan = async (
    app: Awaited<ReturnType<typeof setupTasksE2E>>['app'],
    token: string,
    title: string,
  ) => {
    const created = await request(app.getHttpServer())
      .post('/action-plans')
      .set(bearer(token))
      .send(buildCreateActionPlanDto({ title }));
    return created.body.id as string;
  };

  it('should start the plan when the first task is started', async () => {
    const { app, ownerAuth } = await context;
    const planId = await createPlan(app, ownerAuth.accessToken, 'First task');

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId));

    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));

    const plan = await request(app.getHttpServer())
      .get(`/action-plans/${planId}`)
      .set(bearer(ownerAuth.accessToken));

    expect(plan.body.status).toBe(ActionPlanStatusEnum.IN_PROGRESS);
  });

  it('should complete the plan when the last remaining task is done', async () => {
    const { app, ownerAuth } = await context;
    const planId = await createPlan(app, ownerAuth.accessToken, 'Last task');

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId));

    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/complete`)
      .set(bearer(ownerAuth.accessToken));

    const plan = await request(app.getHttpServer())
      .get(`/action-plans/${planId}`)
      .set(bearer(ownerAuth.accessToken));

    expect(plan.body.status).toBe(ActionPlanStatusEnum.COMPLETED);
  });

  it('should leave an in-progress plan in progress after deleting the last task', async () => {
    const { app, ownerAuth } = await context;
    const planId = await createPlan(app, ownerAuth.accessToken, 'Delete last');

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId));

    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));

    const plan = await request(app.getHttpServer())
      .get(`/action-plans/${planId}`)
      .set(bearer(ownerAuth.accessToken));

    expect(plan.body.status).toBe(ActionPlanStatusEnum.IN_PROGRESS);
  });

  it('should reject task writes on a completed plan and still allow reads', async () => {
    const { app, ownerAuth } = await context;
    const planId = await createPlan(
      app,
      ownerAuth.accessToken,
      'Completed freeze',
    );

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId));

    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/complete`)
      .set(bearer(ownerAuth.accessToken));

    const create = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId, { description: 'Too late' }));
    const start = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    const complete = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/complete`)
      .set(bearer(ownerAuth.accessToken));
    const del = await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));
    const list = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${planId}`)
      .set(bearer(ownerAuth.accessToken));
    const get = await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(create.status).toBe(400);
    expect(create.body.message).toEqual('Action plan is completed.');
    expect(start.status).toBe(400);
    expect(start.body.message).toEqual('Action plan is completed.');
    expect(complete.status).toBe(400);
    expect(complete.body.message).toEqual('Action plan is completed.');
    expect(del.status).toBe(400);
    expect(del.body.message).toEqual('Action plan is completed.');
    expect(list.status).toBe(200);
    expect(get.status).toBe(200);
    expect(get.body.status).toBe(TaskStatusEnum.DONE);
  });

  it('should reject task writes on an archived plan and still allow reads', async () => {
    const { app, ownerAuth } = await context;
    const planId = await createPlan(
      app,
      ownerAuth.accessToken,
      'Archived freeze',
    );

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId));

    await request(app.getHttpServer())
      .post(`/action-plans/${planId}/archive`)
      .set(bearer(ownerAuth.accessToken));

    const create = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(planId, { description: 'Too late' }));
    const start = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    const complete = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/complete`)
      .set(bearer(ownerAuth.accessToken));
    const del = await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));
    const list = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${planId}`)
      .set(bearer(ownerAuth.accessToken));
    const get = await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(create.status).toBe(400);
    expect(create.body.message).toEqual('Action plan is archived.');
    expect(start.status).toBe(400);
    expect(complete.status).toBe(400);
    expect(del.status).toBe(400);
    expect(list.status).toBe(200);
    expect(get.status).toBe(200);
  });
});
