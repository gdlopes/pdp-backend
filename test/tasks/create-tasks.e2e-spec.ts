import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
import { buildCreateTaskDto, NON_EXISTENT_ACTION_PLAN_ID } from './mock';
import { setupTasksE2E, teardownTasksE2E } from './setup';

describe('Tasks - POST /tasks', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  it('should create a task successfully', async () => {
    const { app, actionPlanForTasks } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
    });

    const created = await request(app.getHttpServer()).get(
      `/tasks/${response.body.id}`,
    );
    expect(created.body.status).toBe(TaskStatusEnum.NOT_STARTED);
    expect(created.body.actionPlanId).toBe(actionPlanForTasks.id);
  });

  it('should return error when action plan does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(NON_EXISTENT_ACTION_PLAN_ID));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
  });
});
