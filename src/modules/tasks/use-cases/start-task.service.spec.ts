import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';
import { StartTaskService } from './start-task.service';

const tasksRepositoryMock = {
  save: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

describe('StartTaskService', () => {
  let service: StartTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartTaskService,
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

    service = module.get<StartTaskService>(StartTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';

    it('should start a NOT_STARTED task', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.NOT_STARTED,
      });
      jest.spyOn(tasksRepositoryMock, 'save').mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute(fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      expect(tasksRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatusEnum.IN_PROGRESS }),
      );
    });

    it('should be idempotent when task is already IN_PROGRESS', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute(fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: TaskStatusEnum.IN_PROGRESS,
      });
      expect(tasksRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw when task is already DONE', async () => {
      getTaskByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: TaskStatusEnum.DONE,
      });

      await expect(service.execute(fakeId)).rejects.toThrow(
        'Task is already done.',
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
