import { BadRequestException, Injectable } from '@nestjs/common';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';

@Injectable()
export class AssertActionPlanWritableService {
  public execute(plan: { status: ActionPlanStatusEnum }): void {
    if (plan.status === ActionPlanStatusEnum.COMPLETED) {
      throw new BadRequestException('Action plan is completed.');
    }

    if (plan.status === ActionPlanStatusEnum.ARCHIVED) {
      throw new BadRequestException('Action plan is archived.');
    }
  }
}
