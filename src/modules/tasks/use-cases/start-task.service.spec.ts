import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { StartActionPlanService } from '../../action-plans/use-cases/start-action-plan.service';
import { GetTaskByIdService } from './get-task-by-id.service';
import { StartTaskService } from './start-task.service';

const tasksRepositoryMock = {
  save: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

const findActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

const startActionPlanServiceMock = {
  execute: jest.fn(),
};

describe('StartTaskService', () => {
  let service: StartTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartTaskService,
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
          provide: StartActionPlanService,
          useValue: startActionPlanServiceMock,
        },
      ],
    }).compile();

    service = module.get<StartTaskService>(StartTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';
    const fakePlanId = 'fake-plan-id';

    it('should start a NOT_STARTED task and start a NOT_STARTED plan', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.NOT_STARTED,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.NOT_STARTED,
      });
      tasksRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      expect(startActionPlanServiceMock.execute).toHaveBeenCalledWith(
        'owner-id',
        fakePlanId,
      );
    });

    it('should not change an IN_PROGRESS plan', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.NOT_STARTED,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });
      tasksRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      expect(startActionPlanServiceMock.execute).not.toHaveBeenCalled();
    });

    it('should be idempotent when task is already IN_PROGRESS', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute('owner-id', fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw when task is already DONE', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.DONE,
      });
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Task is already done.',
      );
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject a completed plan', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.NOT_STARTED,
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
        status: TaskStatusEnum.NOT_STARTED,
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
