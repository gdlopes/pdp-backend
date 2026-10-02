import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class DeleteTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
    @Inject(FindActionPlanByIdService)
    private findActionPlanByIdService: FindActionPlanByIdService,
    @Inject(AssertActionPlanWritableService)
    private assertActionPlanWritableService: AssertActionPlanWritableService,
  ) {}

  public async execute(userId: string, id: string): Promise<void> {
    const task = await this.getTaskByIdService.execute(userId, id);
    const plan = await this.findActionPlanByIdService.execute(
      task.actionPlanId,
    );
    this.assertActionPlanWritableService.execute(plan);
    await this.tasksRepository.remove(task);
  }
}
