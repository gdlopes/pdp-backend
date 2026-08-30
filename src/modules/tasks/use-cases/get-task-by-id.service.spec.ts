import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  findOneBy: jest.fn(),
};

describe('GetTaskByIdService', () => {
  let service: GetTaskByIdService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTaskByIdService,
        {
          provide: getRepositoryToken(TasksEntity),
          useValue: tasksRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<GetTaskByIdService>(GetTaskByIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-task-id';

    it('should return the task when found', async () => {
      const fakeTask = {
        id: fakeId,
        actionPlanId: 'fake-action-plan-id',
        status: TaskStatusEnum.NOT_STARTED,
      } as TasksEntity;

      jest
        .spyOn(tasksRepositoryMock, 'findOneBy')
        .mockResolvedValueOnce(fakeTask);

      const result = await service.execute(fakeId);

      expect(result).toEqual(fakeTask);
      expect(tasksRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: fakeId,
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      jest.spyOn(tasksRepositoryMock, 'findOneBy').mockResolvedValueOnce(null);

      await expect(service.execute(fakeId)).rejects.toThrow('Task not found.');
    });
  });
});
