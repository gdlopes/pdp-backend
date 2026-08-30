import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class StartTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
  ) {}

  public async execute(id: string) {
    const task = await this.getTaskByIdService.execute(id);

    if (task.status === TaskStatusEnum.DONE) {
      throw new BadRequestException('Task is already done.');
    }

    if (task.status === TaskStatusEnum.IN_PROGRESS) {
      return { id: task.id, status: task.status };
    }

    task.status = TaskStatusEnum.IN_PROGRESS;
    const saved = await this.tasksRepository.save(task);
    return { id: saved.id, status: saved.status };
  }
}
