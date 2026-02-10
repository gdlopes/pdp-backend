import { Inject, Injectable } from '@nestjs/common';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import ActionPlansEntity from '../database/entities/action-plans.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActionPlansService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(UsersService)
    private userService: UsersService,
  ) {}

  public async create(createActionPlanDto: CreateActionPlanDto) {
    await this.userService.validateUserExists(createActionPlanDto.userId);

    console.log('testing');

    const databaseActionPlan = new ActionPlansEntity();
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
