import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { CompleteActionPlanService } from './complete-action-plan.service';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';

const actionPlansRepositoryMock = {
  save: jest.fn(),
};

const getActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('CompleteActionPlanService', () => {
  let service: CompleteActionPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteActionPlanService,
        {
          provide: getRepositoryToken(ActionPlansEntity),
          useValue: actionPlansRepositoryMock,
        },
        {
          provide: GetActionPlanByIdService,
          useValue: getActionPlanByIdServiceMock,
        },
      ],
    }).compile();

    service = module.get<CompleteActionPlanService>(CompleteActionPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-plan-id';
    const fakeUserId = 'owner-id';

    it('should complete an IN_PROGRESS plan', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });
      actionPlansRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.COMPLETED,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.COMPLETED,
      });
    });

    it('should be idempotent when already COMPLETED', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.COMPLETED,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.COMPLETED,
      });
      expect(actionPlansRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject a plan that has not been started', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.NOT_STARTED,
      });

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        'Action plan has not been started.',
      );
      expect(actionPlansRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject an archived plan', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        'Action plan is archived.',
      );
      expect(actionPlansRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should throw when the plan is missing or foreign', async () => {
      getActionPlanByIdServiceMock.execute.mockRejectedValueOnce(
        new NotFoundException('Action plan not found.'),
      );

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
