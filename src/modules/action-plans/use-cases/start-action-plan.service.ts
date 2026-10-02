import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity, {
  ActionPlanStatusEnum,
} from '../../../database/entities/action-plans.entity';
import { AssertActionPlanWritableService } from './assert-action-plan-writable.service';
import { GetActionPlanByIdService } from './get-action-plan-by-id.service';

@Injectable()
export class StartActionPlanService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    private getActionPlanByIdService: GetActionPlanByIdService,
    private assertActionPlanWritableService: AssertActionPlanWritableService,
  ) {}

  public async execute(userId: string, id: string) {
    const plan = await this.getActionPlanByIdService.execute(userId, id);
    this.assertActionPlanWritableService.execute(plan);

    if (plan.status === ActionPlanStatusEnum.IN_PROGRESS) {
      return { id: plan.id, status: plan.status };
    }

    plan.status = ActionPlanStatusEnum.IN_PROGRESS;
    const saved = await this.actionPlansRepository.save(plan);
    return { id: saved.id, status: saved.status };
  }
}
