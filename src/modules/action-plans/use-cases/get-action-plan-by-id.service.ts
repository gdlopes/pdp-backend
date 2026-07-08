import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';
import { GetUserByIdService } from '../../../modules/users/use-cases/get-user-by-id.service';

@Injectable()
export class GetActionPlanByIdService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
    @Inject(GetUserByIdService)
    private getUserByIdService: GetUserByIdService,
  ) {}

  public async execute(userId: string, id: string): Promise<ActionPlansEntity> {
    await this.getUserByIdService.execute(userId);

    const actionPlan = await this.actionPlansRepository.findOneBy({
      id,
      userId,
    });

    if (!actionPlan) {
      throw new NotFoundException(`Action plan not found for user ${userId}.`);
    }

    return actionPlan;
  }
}
