import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansService } from './action-plans.service';
import {
  CreateActionPlanDto,
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from './dto/create-action-plan.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import ActionPlansEntity from '../database/entities/action-plans.entity';
import { UsersService } from '../users/users.service';

const actionPlansRepositoryMock = {
  save: jest.fn(),
};

const usersServiceMock = {
  validateUserExists: jest.fn(),
};

describe('ActionPlansService', () => {
  let service: ActionPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionPlansService,
        {
          provide: getRepositoryToken(ActionPlansEntity),
          useValue: actionPlansRepositoryMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<ActionPlansService>(ActionPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('#create', () => {
    it('should create an action plan successfully', async () => {
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
      jest
        .spyOn(actionPlansRepositoryMock, 'save')
        .mockResolvedValueOnce({ id: '41892581-9e42-4b8d-8309-6c31d8068811' });
      const validateUserSpy = jest
        .spyOn(usersServiceMock, 'validateUserExists')
        .mockResolvedValue({ id: 'existent-user-id' });

      const result = await service.create(fakeActionPlanData);

      expect(result.id).toBeDefined();
      expect(validateUserSpy).toHaveBeenCalledWith(fakeActionPlanData.userId);
    });
    it.todo('should return error when userId does not exists');
  });
});
