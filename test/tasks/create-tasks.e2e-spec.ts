import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
import { bearer } from '../shared/login';
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
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
    });

    const created = await request(app.getHttpServer())
      .get(`/tasks/${response.body.id}`)
      .set(bearer(ownerAuth.accessToken));
    expect(created.body.status).toBe(TaskStatusEnum.NOT_STARTED);
    expect(created.body.actionPlanId).toBe(actionPlanForTasks.id);
  });

  it('should return error when action plan does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(NON_EXISTENT_ACTION_PLAN_ID));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
  });

  it('should return the same error when the action plan is owned by another user', async () => {
    const { app, otherAuth, actionPlanForTasks } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(otherAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
  });

  it('should return 401 without a token', async () => {
    const { app, actionPlanForTasks } = await context;

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    expect(response.status).toBe(401);
  });
});
