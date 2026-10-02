import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { ArchiveActionPlanService } from './archive-action-plan.service';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';

const actionPlansRepositoryMock = {
  save: jest.fn(),
};

const getActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('ArchiveActionPlanService', () => {
  let service: ArchiveActionPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchiveActionPlanService,
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

    service = module.get<ArchiveActionPlanService>(ArchiveActionPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-plan-id';
    const fakeUserId = 'owner-id';

    it.each([
      ActionPlanStatusEnum.NOT_STARTED,
      ActionPlanStatusEnum.IN_PROGRESS,
      ActionPlanStatusEnum.COMPLETED,
    ])('should archive a %s plan', async (status) => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status,
      });
      actionPlansRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });
    });

    it('should be idempotent when already ARCHIVED', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.ARCHIVED,
      });
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
