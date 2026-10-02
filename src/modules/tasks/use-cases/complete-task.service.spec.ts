import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { CompleteActionPlanService } from '../../action-plans/use-cases/complete-action-plan.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { CompleteTaskService } from './complete-task.service';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  save: jest.fn(),
  count: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

const findActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

const completeActionPlanServiceMock = {
  execute: jest.fn(),
};

describe('CompleteTaskService', () => {
  let service: CompleteTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteTaskService,
        AssertActionPlanWritableService,
        {
          provide: getRepositoryToken(TasksEntity),
          useValue: tasksRepositoryMock,
        },
        {
          provide: GetTaskByIdService,
          useValue: getTaskByIdServiceMock,
        },
        {
          provide: FindActionPlanByIdService,
          useValue: findActionPlanByIdServiceMock,
        },
        {
          provide: CompleteActionPlanService,
          useValue: completeActionPlanServiceMock,
        },
      ],
    }).compile();

    service = module.get<CompleteTaskService>(CompleteTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';
    const fakePlanId = 'fake-plan-id';

    const mutablePlan = {
      id: fakePlanId,
      status: ActionPlanStatusEnum.IN_PROGRESS,
    };

    it('should complete an IN_PROGRESS task when siblings remain', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce(mutablePlan);
      tasksRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.DONE,
      });
      tasksRepositoryMock.count.mockResolvedValueOnce(1);

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({ id: fakeId, status: TaskStatusEnum.DONE });
      expect(completeActionPlanServiceMock.execute).not.toHaveBeenCalled();
    });

    it('should complete the plan when the last remaining task is done', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce(mutablePlan);
      tasksRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.DONE,
      });
      tasksRepositoryMock.count.mockResolvedValueOnce(0);

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({ id: fakeId, status: TaskStatusEnum.DONE });
      expect(completeActionPlanServiceMock.execute).toHaveBeenCalledWith(
        'owner-id',
        fakePlanId,
      );
    });

    it('should be idempotent when task is already DONE on a mutable plan', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.DONE,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce(mutablePlan);

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({ id: fakeId, status: TaskStatusEnum.DONE });
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
      expect(completeActionPlanServiceMock.execute).not.toHaveBeenCalled();
    });

    it('should throw when task has not been started', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.NOT_STARTED,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.NOT_STARTED,
      });

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Task has not been started.',
      );
    });

    it('should reject a completed plan even when the task is already DONE', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.DONE,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.COMPLETED,
      });

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Action plan is completed.',
      );
    });

    it('should reject an archived plan', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Action plan is archived.',
      );
    });

    it('should throw when task does not exist', async () => {
      getTaskByIdServiceMock.execute.mockRejectedValueOnce(
        new NotFoundException('Task not found.'),
      );

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Task not found.',
      );
    });
  });
});
