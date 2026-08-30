import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
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

    it('should create a task with NOT_STARTED status', async () => {
      findActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeCreateTaskDto.actionPlanId,
      });
      jest.spyOn(tasksRepositoryMock, 'save').mockResolvedValueOnce({
        id: '41892581-9e42-4b8d-8309-6c31d8068811',
      });

      const result = await service.execute(fakeCreateTaskDto);

      expect(result).toEqual({ id: '41892581-9e42-4b8d-8309-6c31d8068811' });
      expect(findActionPlanByIdServiceMock.execute).toHaveBeenCalledWith(
        fakeCreateTaskDto.actionPlanId,
      );
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

      await expect(service.execute(fakeCreateTaskDto)).rejects.toThrow(
        'Action plan does not exists.',
      );
      expect(findActionPlanByIdServiceMock.execute).toHaveBeenCalledWith(
        fakeCreateTaskDto.actionPlanId,
      );
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
