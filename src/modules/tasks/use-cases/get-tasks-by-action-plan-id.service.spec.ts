import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { GetTasksByActionPlanIdService } from './get-tasks-by-action-plan-id.service';

const tasksRepositoryMock = {
  findBy: jest.fn(),
};

const findActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('GetTasksByActionPlanIdService', () => {
  let service: GetTasksByActionPlanIdService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTasksByActionPlanIdService,
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

    service = module.get<GetTasksByActionPlanIdService>(
      GetTasksByActionPlanIdService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeActionPlanId = 'fake-action-plan-id';

    it('should return tasks for the action plan', async () => {
      const fakeTasks = [
        {
          id: 'task-1',
          actionPlanId: fakeActionPlanId,
          status: TaskStatusEnum.NOT_STARTED,
        },
      ] as TasksEntity[];

      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeActionPlanId,
      });
      jest
        .spyOn(tasksRepositoryMock, 'findBy')
        .mockResolvedValueOnce(fakeTasks);

      const result = await service.execute(fakeActionPlanId);

      expect(result).toEqual(fakeTasks);
      expect(findActionPlanByIdServiceMock.execute).toHaveBeenCalledWith(
        fakeActionPlanId,
      );
      expect(tasksRepositoryMock.findBy).toHaveBeenCalledWith({
        actionPlanId: fakeActionPlanId,
      });
    });

    it('should return an empty list when the action plan has no tasks', async () => {
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeActionPlanId,
      });
      jest.spyOn(tasksRepositoryMock, 'findBy').mockResolvedValueOnce([]);

      const result = await service.execute(fakeActionPlanId);

      expect(result).toEqual([]);
    });

    it('should return error when action plan does not exist', async () => {
      const findBySpy = jest.spyOn(tasksRepositoryMock, 'findBy');
      findActionPlanByIdServiceMock.execute.mockRejectedValueOnce(
        new BadRequestException('Action plan does not exists.'),
      );

      await expect(service.execute(fakeActionPlanId)).rejects.toThrow(
        'Action plan does not exists.',
      );
      expect(findBySpy).not.toHaveBeenCalled();
    });
  });
});
