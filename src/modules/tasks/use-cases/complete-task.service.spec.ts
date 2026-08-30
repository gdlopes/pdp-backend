import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { CompleteTaskService } from './complete-task.service';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  save: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

describe('CompleteTaskService', () => {
  let service: CompleteTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteTaskService,
        {
          provide: getRepositoryToken(TasksEntity),
          useValue: tasksRepositoryMock,
        },
        {
          provide: GetTaskByIdService,
          useValue: getTaskByIdServiceMock,
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

    it('should complete an IN_PROGRESS task', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      jest.spyOn(tasksRepositoryMock, 'save').mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.DONE,
      });

      const result = await service.execute(fakeId);

      expect(result).toEqual({ id: fakeId, status: TaskStatusEnum.DONE });
      expect(tasksRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatusEnum.DONE }),
      );
    });

    it('should be idempotent when task is already DONE', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.DONE,
      });

      const result = await service.execute(fakeId);

      expect(result).toEqual({ id: fakeId, status: TaskStatusEnum.DONE });
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw when task has not been started', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.NOT_STARTED,
      });

      await expect(service.execute(fakeId)).rejects.toThrow(
        'Task has not been started.',
      );
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw when task does not exist', async () => {
      getTaskByIdServiceMock.execute.mockRejectedValueOnce(
        new NotFoundException('Task not found.'),
      );

      await expect(service.execute(fakeId)).rejects.toThrow('Task not found.');
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });
  });
});
