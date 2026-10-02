import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { GetUserByIdService } from '../../users/use-cases/get-user-by-id.service';
import { CreateActionPlanDto } from '../dto/create-action-plan.dto';
import { CreateActionPlansService } from './create-action-plans.service';

const actionPlansRepositoryMock = {
  save: jest.fn(),
};

const getUserByIdServiceMock = {
  execute: jest.fn(),
};

describe('CreateActionPlansService', () => {
  let service: CreateActionPlansService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateActionPlansService,
        {
          provide: getRepositoryToken(ActionPlansEntity),
          useValue: actionPlansRepositoryMock,
        },
        {
          provide: GetUserByIdService,
          useValue: getUserByIdServiceMock,
        },
      ],
    }).compile();

    service = module.get<CreateActionPlansService>(CreateActionPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#execute', () => {
    const fakeActionPlanData: CreateActionPlanDto = {
      title: 'fake-title',
      specificGoal: 'fake-specific-goal',
      deadline: new Date('2025-12-31'),
      resources: 'fake-resources',
      successIndicator: 'fake-success-indicator',
      rewards: 'fake-rewards',
    };

    it('should create an action plan with NOT_STARTED status', async () => {
      getUserByIdServiceMock.execute.mockResolvedValueOnce({
        id: 'existent-user-id',
      });
      jest
        .spyOn(actionPlansRepositoryMock, 'save')
        .mockResolvedValueOnce({ id: '41892581-9e42-4b8d-8309-6c31d8068811' });

      const result = await service.execute('fake-user-id', fakeActionPlanData);

      expect(result.id).toBeDefined();
      expect(getUserByIdServiceMock.execute).toHaveBeenCalledWith(
        'fake-user-id',
      );
      expect(actionPlansRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'fake-user-id',
          title: fakeActionPlanData.title,
          specificGoal: fakeActionPlanData.specificGoal,
          deadline: fakeActionPlanData.deadline,
          resources: fakeActionPlanData.resources,
          successIndicator: fakeActionPlanData.successIndicator,
          rewards: fakeActionPlanData.rewards,
          status: ActionPlanStatusEnum.NOT_STARTED,
        }),
      );
      expect(actionPlansRepositoryMock.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: ActionPlanStatusEnum.COMPLETED }),
      );
    });

    it('should return error when userId does not exists', async () => {
      const saveSpy = jest.spyOn(actionPlansRepositoryMock, 'save');
      getUserByIdServiceMock.execute.mockRejectedValueOnce(
        new BadRequestException('User does not exists.'),
      );

      const promise = service.execute('fake-user-id', fakeActionPlanData);

      await expect(promise).rejects.toThrow('User does not exists.');
      expect(getUserByIdServiceMock.execute).toHaveBeenCalledWith(
        'fake-user-id',
      );
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
