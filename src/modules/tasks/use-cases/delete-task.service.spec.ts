import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { DeleteTaskService } from './delete-task.service';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  remove: jest.fn(),
};

const getTaskByIdServiceMock = {
  execute: jest.fn(),
};

describe('DeleteTaskService', () => {
  let service: DeleteTaskService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTaskService,
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

    service = module.get<DeleteTaskService>(DeleteTaskService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';

    it('should delete an existing task', async () => {
      const fakeTask = {
        id: fakeId,
        status: TaskStatusEnum.NOT_STARTED,
      } as TasksEntity;

      getTaskByIdServiceMock.execute.mockResolvedValueOnce(fakeTask);
      jest.spyOn(tasksRepositoryMock, 'remove').mockResolvedValueOnce(fakeTask);

      await service.execute(fakeId);

      expect(getTaskByIdServiceMock.execute).toHaveBeenCalledWith(fakeId);
      expect(tasksRepositoryMock.remove).toHaveBeenCalledWith(fakeTask);
    });

    it('should throw when task does not exist', async () => {
      getTaskByIdServiceMock.execute.mockRejectedValueOnce(
        new NotFoundException('Task not found.'),
      );

      await expect(service.execute(fakeId)).rejects.toThrow('Task not found.');
      expect(tasksRepositoryMock.remove).not.toHaveBeenCalled();
    });
  });
});
