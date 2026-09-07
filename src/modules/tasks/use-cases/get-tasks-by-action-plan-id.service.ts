import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity from '../../../database/entities/tasks.entity';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';

@Injectable()
export class GetTasksByActionPlanIdService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    @Inject(FindActionPlanByIdService)
    private findActionPlanByIdService: FindActionPlanByIdService,
  ) {}

  public async execute(
    userId: string,
    actionPlanId: string,
  ): Promise<TasksEntity[]> {
    const actionPlan =
      await this.findActionPlanByIdService.execute(actionPlanId);

    if (actionPlan.userId !== userId) {
      throw new BadRequestException('Action plan does not exists.');
    }

    return this.tasksRepository.findBy({ actionPlanId });
  }
}
