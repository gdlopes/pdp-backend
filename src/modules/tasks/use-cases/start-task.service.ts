import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { StartActionPlanService } from '../../action-plans/use-cases/start-action-plan.service';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class StartTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
    @Inject(FindActionPlanByIdService)
    private findActionPlanByIdService: FindActionPlanByIdService,
    @Inject(AssertActionPlanWritableService)
    private assertActionPlanWritableService: AssertActionPlanWritableService,
    @Inject(StartActionPlanService)
    private startActionPlanService: StartActionPlanService,
  ) {}

  public async execute(userId: string, id: string) {
    const task = await this.getTaskByIdService.execute(userId, id);
    const plan = await this.findActionPlanByIdService.execute(
      task.actionPlanId,
    );
    this.assertActionPlanWritableService.execute(plan);

    if (task.status === TaskStatusEnum.DONE) {
      throw new BadRequestException('Task is already done.');
    }

    if (task.status !== TaskStatusEnum.IN_PROGRESS) {
      task.status = TaskStatusEnum.IN_PROGRESS;
      await this.tasksRepository.save(task);
    }

    if (plan.status === ActionPlanStatusEnum.NOT_STARTED) {
      await this.startActionPlanService.execute(userId, plan.id);
    }

    return { id: task.id, status: TaskStatusEnum.IN_PROGRESS };
  }
}
