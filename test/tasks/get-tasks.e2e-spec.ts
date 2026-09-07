import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
import { bearer } from '../shared/login';
import {
  buildCreateTaskDto,
  NON_EXISTENT_ACTION_PLAN_ID,
  NON_EXISTENT_TASK_ID,
} from './mock';
import { setupTasksE2E, teardownTasksE2E } from './setup';

describe('Tasks - GET /tasks', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  it('should return an empty array when the action plan has no tasks', async () => {
    const { app, actionPlanWithoutTasks, otherAuth } = await context;

    const response = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${actionPlanWithoutTasks.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return tasks for an action plan', async () => {
    const { app, actionPlanForTasks, ownerAuth } = await context;

    await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${actionPlanForTasks.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionPlanId: actionPlanForTasks.id,
          description: 'Complete the Kubernetes introductory course.',
          status: TaskStatusEnum.NOT_STARTED,
          id: expect.any(String),
        }),
      ]),
    );
  });

  it('should return error when action plan does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${NON_EXISTENT_ACTION_PLAN_ID}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
  });

  it('should return the same error when the action plan is owned by another user', async () => {
    const { app, otherAuth, actionPlanForTasks } = await context;

    const response = await request(app.getHttpServer())
      .get(`/tasks?actionPlanId=${actionPlanForTasks.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
  });

  it('should return 401 without a token', async () => {
    const { app, actionPlanForTasks } = await context;

    const response = await request(app.getHttpServer()).get(
      `/tasks?actionPlanId=${actionPlanForTasks.id}`,
    );

    expect(response.status).toBe(401);
  });
});

describe('Tasks - GET /tasks/:id', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  it('should return a task by id', async () => {
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: created.body.id,
      actionPlanId: actionPlanForTasks.id,
      description: 'Complete the Kubernetes introductory course.',
      status: TaskStatusEnum.NOT_STARTED,
    });
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  it('should return not found when task does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .get(`/tasks/${NON_EXISTENT_TASK_ID}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });

  it('should return not found when the task is owned by another user', async () => {
    const { app, actionPlanForTasks, ownerAuth, otherAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
