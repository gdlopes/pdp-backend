import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusEnum } from '../../database/entities/tasks.entity';
import { TasksController } from './tasks.controller';
import { CompleteTaskService } from './use-cases/complete-task.service';
import { CreateTaskService } from './use-cases/create-task.service';
import { DeleteTaskService } from './use-cases/delete-task.service';
import { GetTaskByIdService } from './use-cases/get-task-by-id.service';
import { GetTasksByActionPlanIdService } from './use-cases/get-tasks-by-action-plan-id.service';
import { StartTaskService } from './use-cases/start-task.service';

describe('TasksController', () => {
  let controller: TasksController;
  let createService: CreateTaskService;
  let getByActionPlanIdService: GetTasksByActionPlanIdService;
  let getByIdService: GetTaskByIdService;
  let startService: StartTaskService;
  let completeService: CompleteTaskService;
  let deleteService: DeleteTaskService;

  const createdResponse = { id: 'task-1' };
  const statusResponse = { id: 'task-1', status: TaskStatusEnum.IN_PROGRESS };
  const fakeTask = {
    id: 'task-1',
    actionPlanId: 'plan-1',
    description: 'Complete the course',
    status: TaskStatusEnum.NOT_STARTED,
  };
  const fakeTasks = [fakeTask];
  const createTaskDto = {
    actionPlanId: 'plan-1',
    description: 'Complete the course',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: CreateTaskService,
          useValue: { execute: jest.fn().mockResolvedValue(createdResponse) },
        },
        {
          provide: GetTasksByActionPlanIdService,
          useValue: { execute: jest.fn().mockResolvedValue(fakeTasks) },
        },
        {
          provide: GetTaskByIdService,
          useValue: { execute: jest.fn().mockResolvedValue(fakeTask) },
        },
        {
          provide: StartTaskService,
          useValue: { execute: jest.fn().mockResolvedValue(statusResponse) },
        },
        {
          provide: CompleteTaskService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'task-1',
              status: TaskStatusEnum.DONE,
            }),
          },
        },
        {
          provide: DeleteTaskService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    createService = module.get<CreateTaskService>(CreateTaskService);
    getByActionPlanIdService = module.get<GetTasksByActionPlanIdService>(
      GetTasksByActionPlanIdService,
    );
    getByIdService = module.get<GetTaskByIdService>(GetTaskByIdService);
    startService = module.get<StartTaskService>(StartTaskService);
    completeService = module.get<CompleteTaskService>(CompleteTaskService);
    deleteService = module.get<DeleteTaskService>(DeleteTaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST tasks create', async () => {
    const response = await controller.create(createTaskDto);

    expect(response).toEqual(createdResponse);
    expect(createService.execute).toHaveBeenCalledWith(createTaskDto);
  });

  it('GET tasks findByActionPlanId', async () => {
    const actionPlanId = 'plan-1';

    const response = await controller.findByActionPlanId(actionPlanId);

    expect(response).toEqual(fakeTasks);
    expect(getByActionPlanIdService.execute).toHaveBeenCalledWith(actionPlanId);
  });

  it('GET tasks findOne', async () => {
    const id = 'task-1';

    const response = await controller.findOne(id);

    expect(response).toEqual(fakeTask);
    expect(getByIdService.execute).toHaveBeenCalledWith(id);
  });

  it('POST tasks start', async () => {
    const id = 'task-1';

    const response = await controller.start(id);

    expect(response).toEqual(statusResponse);
    expect(startService.execute).toHaveBeenCalledWith(id);
  });

  it('POST tasks complete', async () => {
    const id = 'task-1';

    const response = await controller.complete(id);

    expect(response).toEqual({ id: 'task-1', status: TaskStatusEnum.DONE });
    expect(completeService.execute).toHaveBeenCalledWith(id);
  });

  it('DELETE tasks delete', async () => {
    const id = 'task-1';

    await controller.delete(id);

    expect(deleteService.execute).toHaveBeenCalledWith(id);
  });
});
