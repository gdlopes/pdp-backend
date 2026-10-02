import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
import { bearer } from '../shared/login';
import { buildCreateTaskDto, NON_EXISTENT_TASK_ID } from './mock';
import { setupTasksE2E, teardownTasksE2E } from './setup';

describe('Tasks - POST /tasks/:id/start', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  it('should start a task', async () => {
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      status: TaskStatusEnum.IN_PROGRESS,
    });
  });

  it('should be idempotent when the task is already in progress', async () => {
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      status: TaskStatusEnum.IN_PROGRESS,
    });
  });

  it('should return error when the task is already done', async () => {
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const first = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));
    const second = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(
        buildCreateTaskDto(actionPlanForTasks.id, {
          description: 'Keep the plan in progress',
        }),
      );

    await request(app.getHttpServer())
      .post(`/tasks/${first.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/tasks/${second.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));
    await request(app.getHttpServer())
      .post(`/tasks/${first.body.id}/complete`)
      .set(bearer(ownerAuth.accessToken));

    const response = await request(app.getHttpServer())
      .post(`/tasks/${first.body.id}/start`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Task is already done.');
  });

  it('should return not found when task does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .post(`/tasks/${NON_EXISTENT_TASK_ID}/start`)
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
      .post(`/tasks/${created.body.id}/start`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
