import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { AssertActionPlanWritableService } from './assert-action-plan-writable.service';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';
import { StartActionPlanService } from './start-action-plan.service';

const actionPlansRepositoryMock = {
  save: jest.fn(),
};

const getActionPlanByIdServiceMock = {
  execute: jest.fn(),
};

describe('StartActionPlanService', () => {
  let service: StartActionPlanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartActionPlanService,
        AssertActionPlanWritableService,
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

    service = module.get<StartActionPlanService>(StartActionPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeId = 'fake-plan-id';
    const fakeUserId = 'owner-id';

    it('should start a NOT_STARTED plan', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.NOT_STARTED,
      });
      actionPlansRepositoryMock.save.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });
      expect(actionPlansRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ActionPlanStatusEnum.IN_PROGRESS }),
      );
    });

    it('should be idempotent when already IN_PROGRESS', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });

      const result = await service.execute(fakeUserId, fakeId);

      expect(result).toEqual({
        id: fakeId,
        status: ActionPlanStatusEnum.IN_PROGRESS,
      });
      expect(actionPlansRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject a completed plan', async () => {
      getActionPlanByIdServiceMock.execute.mockResolvedValueOnce({
        id: fakeId,
        status: ActionPlanStatusEnum.COMPLETED,
      });

      await expect(service.execute(fakeUserId, fakeId)).rejects.toThrow(
        'Action plan is completed.',
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
