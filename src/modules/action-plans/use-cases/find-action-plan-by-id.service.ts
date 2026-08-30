import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ActionPlansEntity from '../../../database/entities/action-plans.entity';

@Injectable()
export class FindActionPlanByIdService {
  constructor(
    @InjectRepository(ActionPlansEntity)
    private actionPlansRepository: Repository<ActionPlansEntity>,
  ) {}

  public async execute(id: string): Promise<ActionPlansEntity> {
    const actionPlan = await this.actionPlansRepository.findOne({
      where: { id },
    });

    if (!actionPlan) {
      throw new BadRequestException('Action plan does not exists.');
    }

    return actionPlan;
  }
}
