import * as request from 'supertest';
import { buildCreateActionPlanDto, NON_EXISTENT_USER_ID } from './mock';
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
    const { app, userForCreation } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .send(buildCreateActionPlanDto(userForCreation.id));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(Number),
    });
  });

  it('should return error when user does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/action-plans')
      .send(buildCreateActionPlanDto(NON_EXISTENT_USER_ID));

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('User does not exists.');
  });
});
