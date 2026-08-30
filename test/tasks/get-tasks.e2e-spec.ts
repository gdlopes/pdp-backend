import * as request from 'supertest';
import { TaskStatusEnum } from '../../src/database/entities/tasks.entity';
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
    const { app, actionPlanWithoutTasks } = await context;

    const response = await request(app.getHttpServer()).get(
      `/tasks?actionPlanId=${actionPlanWithoutTasks.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return tasks for an action plan', async () => {
    const { app, actionPlanForTasks } = await context;

    await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer()).get(
      `/tasks?actionPlanId=${actionPlanForTasks.id}`,
    );

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
    const { app } = await context;

    const response = await request(app.getHttpServer()).get(
      `/tasks?actionPlanId=${NON_EXISTENT_ACTION_PLAN_ID}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('Action plan does not exists.');
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
    const { app, actionPlanForTasks } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer()).get(
      `/tasks/${created.body.id}`,
    );

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
    const { app } = await context;

    const response = await request(app.getHttpServer()).get(
      `/tasks/${NON_EXISTENT_TASK_ID}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
