import * as request from 'supertest';
import { bearer } from '../shared/login';
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
    const { app, actionPlanForTasks, ownerAuth } = await context;

    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(bearer(ownerAuth.accessToken))
      .send(buildCreateTaskDto(actionPlanForTasks.id));

    const response = await request(app.getHttpServer())
      .delete(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const getResponse = await request(app.getHttpServer())
      .get(`/tasks/${created.body.id}`)
      .set(bearer(ownerAuth.accessToken));
    expect(getResponse.status).toBe(404);
  });

  it('should return not found when task does not exist', async () => {
    const { app, ownerAuth } = await context;

    const response = await request(app.getHttpServer())
      .delete(`/tasks/${NON_EXISTENT_TASK_ID}`)
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
      .delete(`/tasks/${created.body.id}`)
      .set(bearer(otherAuth.accessToken));

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual('Task not found.');
  });
});
