import * as request from 'supertest';
import { buildCreateTaskDto, NON_EXISTENT_TASK_ID } from './mock';
import { setupTasksE2E, teardownTasksE2E } from './setup';

describe('Tasks - DELETE /tasks/:id', () => {
  jest.setTimeout(120000);

  const context = setupTasksE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownTasksE2E(await context);
  });

  it('should delete a task', async () => {
    const { app, actionPlanForTasks } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer()).delete(
      `/tasks/${created.body.id}`,
    );

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const getResponse = await request(app.getHttpServer()).get(
      `/tasks/${created.body.id}`,
    );
    expect(getResponse.status).toBe(404);
  });

  it('should return not found when task does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).delete(
      `/tasks/${NON_EXISTENT_TASK_ID}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
