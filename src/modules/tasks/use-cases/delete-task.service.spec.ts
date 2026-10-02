import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { DeleteTaskService } from './delete-task.service';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  remove: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

const findActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('DeleteTaskService', () => {
  let service: DeleteTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskService,
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
      ],
    }).compile();

    service = module.get<DeleteTaskService>(DeleteTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';
    const fakePlanId = 'fake-plan-id';

    it('should delete an existing task without changing plan status', async () => {
      const fakeTask = {
        id: fakeId,
        actionPlanId: fakePlanId,
        status: TaskStatusEnum.NOT_STARTED,
      } as TasksEntity;

      getTaskByIdServiceMock.execute.mockResolvedValueOnce(fakeTask);
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakePlanId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });
      jest.spyOn(tasksRepositoryMock, 'remove').mockResolvedValueOnce(fakeTask);

      await service.execute('owner-id', fakeId);

      expect(tasksRepositoryMock.remove).toHaveBeenCalledWith(fakeTask);
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
      expect(tasksRepositoryMock.remove).not.toHaveBeenCalled();
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
      expect(tasksRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it('should throw when task does not exist', async () => {
      getTaskByIdServiceMock.execute.mockRejectedValueOnce(
        new NotFoundException('Task not found.'),
      );

      await expect(service.execute('owner-id', fakeId)).rejects.toThrow(
        'Task not found.',
      );
      expect(tasksRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
