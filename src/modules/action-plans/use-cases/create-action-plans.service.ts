import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';
import { GetUserByIdService } from '../../../modules/users/use-cases/get-user-by-id.service';
import { CreateActionPlanDto } from '../dto/create-action-plan.dto';

@Injectable()
export class CreateActionPlansService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(GetUserByIdService)
    private getUserByIdService: GetUserByIdService,
  ) {}

  public async execute(createActionPlanDto: CreateActionPlanDto) {
    await this.getUserByIdService.execute(createActionPlanDto.userId);

    const databaseActionPlan = new ActionPlansEntity();
    databaseActionPlan.userId = createActionPlanDto.userId;
    databaseActionPlan.title = createActionPlanDto.title;
    databaseActionPlan.goal = createActionPlanDto.goal;
    databaseActionPlan.alignmentWithLifeCareer =
      createActionPlanDto.alignmentWithLifeCareer;
    databaseActionPlan.motivation = createActionPlanDto.motivation;
    databaseActionPlan.currentLevel = createActionPlanDto.currentLevel;
    databaseActionPlan.expectedLevel = createActionPlanDto.expectedLevel;
    databaseActionPlan.specificGoal = createActionPlanDto.specificGoal;
    databaseActionPlan.progressTrackingMethod =
      createActionPlanDto.progressTrackingMethod;
    databaseActionPlan.resources = createActionPlanDto.resources;
    databaseActionPlan.developmentImpact =
      createActionPlanDto.developmentImpact;
    databaseActionPlan.estimatedCompletionDate =
      createActionPlanDto.estimatedCompletionDate;
    databaseActionPlan.learningMethod = createActionPlanDto.learningMethod;
    databaseActionPlan.timeCommitment = createActionPlanDto.timeCommitment;
    databaseActionPlan.knowledgeApplication =
      createActionPlanDto.knowledgeApplication;
    databaseActionPlan.rewards = createActionPlanDto.rewards;
    databaseActionPlan.reviewCommitment = createActionPlanDto.reviewCommitment;

    const { id } = await this.actionPlansRepository.save(databaseActionPlan);
    return { id };
  }
}
