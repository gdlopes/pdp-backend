import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
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

  public async execute(
    userId: string,
    createActionPlanDto: CreateActionPlanDto,
  ) {
    await this.getUserByIdService.execute(userId);

    const databaseActionPlan = new ActionPlansEntity();
    databaseActionPlan.userId = userId;
    databaseActionPlan.title = createActionPlanDto.title;
    databaseActionPlan.specificGoal = createActionPlanDto.specificGoal;
    databaseActionPlan.deadline = createActionPlanDto.deadline;
    databaseActionPlan.resources = createActionPlanDto.resources;
    databaseActionPlan.successIndicator = createActionPlanDto.successIndicator;
    databaseActionPlan.rewards = createActionPlanDto.rewards;
    databaseActionPlan.status = ActionPlanStatusEnum.NOT_STARTED;

    const { id } = await this.actionPlansRepository.save(databaseActionPlan);
    return { id };
  }
}
