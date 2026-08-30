import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
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
    const { app, actionPlanForTasks } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer()).post(
      `/tasks/${created.body.id}/start`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      status: TaskStatusEnum.IN_PROGRESS,
    });
  });

  it('should be idempotent when the task is already in progress', async () => {
    const { app, actionPlanForTasks } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    await request(app.getHttpServer()).post(`/tasks/${created.body.id}/start`);

    const response = await request(app.getHttpServer()).post(
      `/tasks/${created.body.id}/start`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      status: TaskStatusEnum.IN_PROGRESS,
    });
  });

  it('should return error when the task is already done', async () => {
    const { app, actionPlanForTasks } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    await request(app.getHttpServer()).post(`/tasks/${created.body.id}/start`);
    await request(app.getHttpServer()).post(
      `/tasks/${created.body.id}/complete`,
    );

    const response = await request(app.getHttpServer()).post(
      `/tasks/${created.body.id}/start`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Task is already done.');
  });

  it('should return not found when task does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).post(
      `/tasks/${NON_EXISTENT_TASK_ID}/start`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
