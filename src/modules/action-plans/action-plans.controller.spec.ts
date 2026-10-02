import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlanStatusEnum } from '../../database/entities/action-plans.entity';
import { ActionPlansController } from './action-plans.controller';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import { ArchiveActionPlanService } from './use-cases/archive-action-plan.service';
import { CompleteActionPlanService } from './use-cases/complete-action-plan.service';
import { CreateActionPlansService } from './use-cases/create-action-plans.service';
import { GetActionPlanByIdService } from './use-cases/get-action-plan-by-id.service';
import { GetActionPlansByUserIdService } from './use-cases/get-action-plans-by-user-id.service';
import { StartActionPlanService } from './use-cases/start-action-plan.service';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;
  let createService: CreateActionPlansService;
  let getByUserIdService: GetActionPlansByUserIdService;
  let getByIdService: GetActionPlanByIdService;
  let startService: StartActionPlanService;
  let completeService: CompleteActionPlanService;
  let archiveService: ArchiveActionPlanService;

  const createdResponse = { id: 'plan-1' };
  const currentUser = { id: 'user-123' };
  const statusResponse = {
    id: 'plan-1',
    status: ActionPlanStatusEnum.IN_PROGRESS,
  };

  const fakeActionPlans = [
    { id: 'plan-1', userId: 'user-123', title: 'Plano 1' },
    { id: 'plan-2', userId: 'user-123', title: 'Plano 2' },
  ];

  const fakeActionPlan = { id: 'plan-1', userId: 'user-123', title: 'Plano 1' };

  const createActionPlanDto: CreateActionPlanDto = {
    title: 'Plano de Ação',
    specificGoal: 'Meta específica',
    deadline: new Date(),
    resources: 'Recursos',
    successIndicator: 'Indicador',
    rewards: 'Recompensas',
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
        {
          provide: StartActionPlanService,
          useValue: {
            execute: jest.fn().mockResolvedValue(statusResponse),
          },
        },
        {
          provide: CompleteActionPlanService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'plan-1',
              status: ActionPlanStatusEnum.COMPLETED,
            }),
          },
        },
        {
          provide: ArchiveActionPlanService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'plan-1',
              status: ActionPlanStatusEnum.ARCHIVED,
            }),
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
    startService = module.get<StartActionPlanService>(StartActionPlanService);
    completeService = module.get<CompleteActionPlanService>(
      CompleteActionPlanService,
    );
    archiveService = module.get<ArchiveActionPlanService>(
      ArchiveActionPlanService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST action-plans create', async () => {
    const response = await controller.create(currentUser, createActionPlanDto);

    expect(response).toEqual(createdResponse);
    expect(createService.execute).toHaveBeenCalledWith(
      currentUser.id,
      createActionPlanDto,
    );
  });

  it('GET action-plans findByUserId', async () => {
    const response = await controller.findByUserId(currentUser);

    expect(response).toEqual(fakeActionPlans);
    expect(getByUserIdService.execute).toHaveBeenCalledWith(currentUser.id);
  });

  it('GET action-plans findOne', async () => {
    const id = 'plan-1';

    const response = await controller.findOne(currentUser, id);

    expect(response).toEqual(fakeActionPlan);
    expect(getByIdService.execute).toHaveBeenCalledWith(currentUser.id, id);
  });

  it('POST action-plans start', async () => {
    const id = 'plan-1';

    const response = await controller.start(currentUser, id);

    expect(response).toEqual(statusResponse);
    expect(startService.execute).toHaveBeenCalledWith(currentUser.id, id);
  });

  it('POST action-plans complete', async () => {
    const id = 'plan-1';

    const response = await controller.complete(currentUser, id);

    expect(response).toEqual({
      id: 'plan-1',
      status: ActionPlanStatusEnum.COMPLETED,
    });
    expect(completeService.execute).toHaveBeenCalledWith(currentUser.id, id);
  });

  it('POST action-plans archive', async () => {
    const id = 'plan-1';

    const response = await controller.archive(currentUser, id);

    expect(response).toEqual({
      id: 'plan-1',
      status: ActionPlanStatusEnum.ARCHIVED,
    });
    expect(archiveService.execute).toHaveBeenCalledWith(currentUser.id, id);
  });
});
