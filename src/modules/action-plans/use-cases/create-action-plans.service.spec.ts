import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';
import { GetUserByIdService } from '../../users/use-cases/get-user-by-id.service';
import {
  CreateActionPlanDto,
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from '../dto/create-action-plan.dto';
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
      userId: 'fake-user-id',
      title: 'fake-title',
      goal: 'fake-goal',
      alignmentWithLifeCareer: 'fake-alignment-with-life-carrier',
      motivation: 'fake-motivation',
      currentLevel: CurrentLevelEnum.BEGINNER,
      expectedLevel: ExpectedLevelEnum.INTERMEDIARY,
      specificGoal: 'fake-specific-goal',
      progressTrackingMethod: 'fake-progress-tracking-method',
      resources: 'fake-resources',
      developmentImpact: 'fake-development-impact',
      estimatedCompletionDate: new Date(),
      learningMethod: 'fake-learning-method',
      timeCommitment: 3,
      knowledgeApplication: 'fake-knowledge-application',
      rewards: 'fake-rewards',
      reviewCommitment: ReviewCommitmentEnum.BIWEEKLY,
    };

    it('should create an action plan successfully', async () => {
      getUserByIdServiceMock.execute.mockResolvedValueOnce({
        id: 'existent-user-id',
      });
      jest
        .spyOn(actionPlansRepositoryMock, 'save')
        .mockResolvedValueOnce({ id: '41892581-9e42-4b8d-8309-6c31d8068811' });

      const result = await service.execute(fakeActionPlanData);

      expect(result.id).toBeDefined();
      expect(getUserByIdServiceMock.execute).toHaveBeenCalledWith(
        fakeActionPlanData.userId,
      );
    });

    it('should return error when userId does not exists', async () => {
      const saveSpy = jest.spyOn(actionPlansRepositoryMock, 'save');
      getUserByIdServiceMock.execute.mockRejectedValueOnce(
        new BadRequestException('User does not exists.'),
      );

      const promise = service.execute(fakeActionPlanData);

      await expect(promise).rejects.toThrow('User does not exists.');
      expect(getUserByIdServiceMock.execute).toHaveBeenCalledWith(
        fakeActionPlanData.userId,
      );
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
