import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';

const tasksRepositoryMock = {
  findOne: jest.fn(),
};

describe('GetTaskByIdService', () => {
  let service: GetTaskByIdService;
  const ownerId = 'owner-id';
  const fakeId = 'fake-task-id';

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
    it('should return the task when found and owned', async () => {
      const fakeTask = {
        id: fakeId,
        actionPlanId: 'fake-action-plan-id',
        status: TaskStatusEnum.NOT_STARTED,
        actionPlan: { userId: ownerId },
      } as TasksEntity;

      jest
        .spyOn(tasksRepositoryMock, 'findOne')
        .mockResolvedValueOnce(fakeTask);

      const result = await service.execute(ownerId, fakeId);

      expect(result).toMatchObject({
        id: fakeId,
        actionPlanId: 'fake-action-plan-id',
        status: TaskStatusEnum.NOT_STARTED,
      });
      expect((result as { actionPlan?: unknown }).actionPlan).toBeUndefined();
      expect(tasksRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: fakeId },
        relations: ['actionPlan'],
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      jest.spyOn(tasksRepositoryMock, 'findOne').mockResolvedValueOnce(null);

      await expect(service.execute(ownerId, fakeId)).rejects.toThrow(
        'Task not found.',
      );
    });

    it('should throw NotFoundException when the parent plan is owned by another user', async () => {
      jest.spyOn(tasksRepositoryMock, 'findOne').mockResolvedValueOnce({
        id: fakeId,
        actionPlan: { userId: 'other-user' },
      });

      await expect(service.execute(ownerId, fakeId)).rejects.toThrow(
        'Task not found.',
      );
    });
  });
});
