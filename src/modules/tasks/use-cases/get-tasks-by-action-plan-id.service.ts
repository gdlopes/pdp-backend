import { Inject, Injectable } from '@nestjs/common';
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

  public async execute(actionPlanId: string): Promise<TasksEntity[]> {
    await this.findActionPlanByIdService.execute(actionPlanId);

    return this.tasksRepository.findBy({ actionPlanId });
  }
}
