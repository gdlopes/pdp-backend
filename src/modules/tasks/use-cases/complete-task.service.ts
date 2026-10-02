import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ActionPlanStatusEnum } from '../../../database/entities/action-plans.entity';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { CompleteActionPlanService } from '../../action-plans/use-cases/complete-action-plan.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class CompleteTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
    @Inject(FindActionPlanByIdService)
    private findActionPlanByIdService: FindActionPlanByIdService,
    @Inject(AssertActionPlanWritableService)
    private assertActionPlanWritableService: AssertActionPlanWritableService,
    @Inject(CompleteActionPlanService)
    private completeActionPlanService: CompleteActionPlanService,
  ) {}

  public async execute(userId: string, id: string) {
    const task = await this.getTaskByIdService.execute(userId, id);
    const plan = await this.findActionPlanByIdService.execute(
      task.actionPlanId,
    );
    this.assertActionPlanWritableService.execute(plan);

    if (task.status === TaskStatusEnum.NOT_STARTED) {
      throw new BadRequestException('Task has not been started.');
    }

    if (task.status === TaskStatusEnum.DONE) {
      return { id: task.id, status: task.status };
    }

    task.status = TaskStatusEnum.DONE;
    const saved = await this.tasksRepository.save(task);

    if (plan.status === ActionPlanStatusEnum.IN_PROGRESS) {
      const remaining = await this.tasksRepository.count({
        where: {
          actionPlanId: task.actionPlanId,
          status: Not(TaskStatusEnum.DONE),
        },
      });

      if (remaining === 0) {
        await this.completeActionPlanService.execute(userId, plan.id);
      }
    }

    return { id: saved.id, status: saved.status };
  }
}
