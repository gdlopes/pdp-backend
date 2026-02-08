import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansController } from './action-plans.controller';
import { ActionPlansService } from './action-plans.service';
import {
  CurrentLevelEnum,
  ExpectedLevelEnum,
  ReviewCommitmentEnum,
} from './dto/create-action-plan.dto';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;
  let service: ActionPlansService;

  const createdResponse = { id: '123' };

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
          provide: ActionPlansService,
          useValue: {
            create: jest.fn().mockResolvedValue(createdResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<ActionPlansController>(ActionPlansController);
    service = module.get<ActionPlansService>(ActionPlansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST action-plans create', async () => {
    const response = await controller.create(createActionPlanDto);

    expect(response).toEqual(createdResponse);
    expect(service.create).toHaveBeenCalledWith(createActionPlanDto);
  });
});
