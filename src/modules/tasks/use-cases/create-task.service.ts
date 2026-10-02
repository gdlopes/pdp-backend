import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { AssertActionPlanWritableService } from '../../action-plans/use-cases/assert-action-plan-writable.service';
import { FindActionPlanByIdService } from '../../action-plans/use-cases/find-action-plan-by-id.service';
import { CreateTaskDto } from '../dto/create-task.dto';

@Injectable()
export class CreateTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    @Inject(FindActionPlanByIdService)
    private findActionPlanByIdService: FindActionPlanByIdService,
    @Inject(AssertActionPlanWritableService)
    private assertActionPlanWritableService: AssertActionPlanWritableService,
  ) {}

  public async execute(userId: string, createTaskDto: CreateTaskDto) {
    const actionPlan = await this.findActionPlanByIdService.execute(
      createTaskDto.actionPlanId,
    );

    if (actionPlan.userId !== userId) {
      throw new BadRequestException('Action plan does not exists.');
    }

    this.assertActionPlanWritableService.execute(actionPlan);

    const databaseTask = new TasksEntity();
    databaseTask.actionPlanId = createTaskDto.actionPlanId;
    databaseTask.description = createTaskDto.description;
    databaseTask.status = TaskStatusEnum.NOT_STARTED;

    const { id } = await this.tasksRepository.save(databaseTask);
    return { id };
  }
}
