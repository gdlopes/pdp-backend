import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansController } from './action-plans.controller';
import {
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from './dto/create-action-plan.dto';
import { CreateActionPlansService } from './use-cases/create-action-plans.service';
import { GetActionPlanByIdService } from './use-cases/get-action-plan-by-id.service';
import { GetActionPlansByUserIdService } from './use-cases/get-action-plans-by-user-id.service';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;
  let createService: CreateActionPlansService;
  let getByUserIdService: GetActionPlansByUserIdService;
  let getByIdService: GetActionPlanByIdService;

  const createdResponse = { id: 'plan-1' };

  const fakeActionPlans = [
    { id: 'plan-1', userId: 'user-123', title: 'Plano 1' },
    { id: 'plan-2', userId: 'user-123', title: 'Plano 2' },
  ];

  const fakeActionPlan = { id: 'plan-1', userId: 'user-123', title: 'Plano 1' };

  const createActionPlanDto = {
    userId: 'user-123',
    title: 'Plano de Ação',
    goal: 'Meu objetivo',
    alignmentWithLifeCareer: 'Alinhamento',
    motivation: 'Minha motivação',
    currentLevel: CurrentLevelEnum.BEGINNER,
    expectedLevel: ExpectedLevelEnum.INTERMEDIARY,
    specificGoal: 'Meta específica',
    progressTrackingMethod: 'Método',
    resources: 'Recursos',
    developmentImpact: 'Impacto',
    estimatedCompletionDate: new Date(),
    learningMethod: 'Aprendizado',
    timeCommitment: 2,
    knowledgeApplication: 'Aplicação',
    rewards: 'Recompensas',
    reviewCommitment: ReviewCommitmentEnum.BIWEEKLY,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionPlansController],
      providers: [
        {
          provide: CreateActionPlansService,
          useValue: {
            execute: jest.fn().mockResolvedValue(createdResponse),
          },
        },
        {
          provide: GetActionPlansByUserIdService,
          useValue: {
            execute: jest.fn().mockResolvedValue(fakeActionPlans),
          },
        },
        {
          provide: GetActionPlanByIdService,
          useValue: {
            execute: jest.fn().mockResolvedValue(fakeActionPlan),
          },
        },
      ],
    }).compile();

    controller = module.get<ActionPlansController>(ActionPlansController);
    createService = module.get<CreateActionPlansService>(
      CreateActionPlansService,
    );
    getByUserIdService = module.get<GetActionPlansByUserIdService>(
      GetActionPlansByUserIdService,
    );
    getByIdService = module.get<GetActionPlanByIdService>(
      GetActionPlanByIdService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST action-plans create', async () => {
    const response = await controller.create(createActionPlanDto);

    expect(response).toEqual(createdResponse);
    expect(createService.execute).toHaveBeenCalledWith(createActionPlanDto);
  });

  it('GET action-plans findByUserId', async () => {
    const userId = 'user-123';

    const response = await controller.findByUserId(userId);

    expect(response).toEqual(fakeActionPlans);
    expect(getByUserIdService.execute).toHaveBeenCalledWith(userId);
  });

  it('GET action-plans findOne', async () => {
    const userId = 'user-123';
    const id = 'plan-1';

    const response = await controller.findOne(userId, id);

    expect(response).toEqual(fakeActionPlan);
    expect(getByIdService.execute).toHaveBeenCalledWith(userId, id);
  });
});
