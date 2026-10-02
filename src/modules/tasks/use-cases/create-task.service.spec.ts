import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { CreateTaskService } from './create-task.service';

const tasksRepositoryMock = {
  save: jest.fn(),
};

const findActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('CreateTaskService', () => {
  let service: CreateTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskService,
        AssertActionPlanWritableService,
        {
          provide: getRepositoryToken(TasksEntity),
          useValue: tasksRepositoryMock,
        },
        {
          provide: FindActionPlanByIdService,
          useValue: findActionPlanByIdServiceMock,
        },
      ],
    }).compile();

    service = module.get<CreateTaskService>(CreateTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeCreateTaskDto: CreateTaskDto = {
      actionPlanId: 'fake-action-plan-id',
      description: 'Complete the Kubernetes introductory course.',
    };

    it.each([
      ActionPlanStatusEnum.NOT_STARTED,
      ActionPlanStatusEnum.IN_PROGRESS,
    ])('should create a task when the plan is %s', async (status) => {
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeCreateTaskDto.actionPlanId,
        userId: 'owner-id',
        status,
      });
      jest.spyOn(tasksRepositoryMock, 'save').mockResolvedValueOnce({
        id: '41892581-9e42-4b8d-8309-6c31d8068811',
      });

      const result = await service.execute('owner-id', fakeCreateTaskDto);

      expect(result).toEqual({ id: '41892581-9e42-4b8d-8309-6c31d8068811' });
      expect(tasksRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          actionPlanId: fakeCreateTaskDto.actionPlanId,
          description: fakeCreateTaskDto.description,
          status: TaskStatusEnum.NOT_STARTED,
        }),
      );
    });

    it('should return error when action plan does not exist', async () => {
      const saveSpy = jest.spyOn(tasksRepositoryMock, 'save');
      findActionPlanByIdServiceMock.execute.mockRejectedValueOnce(
        new BadRequestException('Action plan does not exists.'),
      );

      await expect(
        service.execute('owner-id', fakeCreateTaskDto),
      ).rejects.toThrow('Action plan does not exists.');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should return error when action plan is owned by another user', async () => {
      const saveSpy = jest.spyOn(tasksRepositoryMock, 'save');
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeCreateTaskDto.actionPlanId,
        userId: 'other-user',
        status: ActionPlanStatusEnum.NOT_STARTED,
      });

      await expect(
        service.execute('owner-id', fakeCreateTaskDto),
      ).rejects.toThrow('Action plan does not exists.');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should reject a completed plan', async () => {
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeCreateTaskDto.actionPlanId,
        userId: 'owner-id',
        status: ActionPlanStatusEnum.COMPLETED,
      });

      await expect(
        service.execute('owner-id', fakeCreateTaskDto),
      ).rejects.toThrow('Action plan is completed.');
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject an archived plan', async () => {
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeCreateTaskDto.actionPlanId,
        userId: 'owner-id',
        status: ActionPlanStatusEnum.ARCHIVED,
      });

      await expect(
        service.execute('owner-id', fakeCreateTaskDto),
      ).rejects.toThrow('Action plan is archived.');
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });
  });
});
