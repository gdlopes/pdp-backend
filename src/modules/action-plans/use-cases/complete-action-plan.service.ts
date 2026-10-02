import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';

@Injectable()
export class CompleteActionPlanService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    private getActionPlanByIdService: GetActionPlanByIdService,
  ) {}

  public async execute(userId: string, id: string) {
    const plan = await this.getActionPlanByIdService.execute(userId, id);

    if (plan.status === ActionPlanStatusEnum.ARCHIVED) {
      throw new BadRequestException('Action plan is archived.');
    }

    if (plan.status === ActionPlanStatusEnum.NOT_STARTED) {
      throw new BadRequestException('Action plan has not been started.');
    }

    if (plan.status === ActionPlanStatusEnum.COMPLETED) {
      return { id: plan.id, status: plan.status };
    }

    plan.status = ActionPlanStatusEnum.COMPLETED;
    const saved = await this.actionPlansRepository.save(plan);
    return { id: saved.id, status: saved.status };
  }
}
