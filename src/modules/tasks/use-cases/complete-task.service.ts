import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity, {
  TaskStatusEnum,
} from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class CompleteTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
  ) {}

  public async execute(id: string) {
    const task = await this.getTaskByIdService.execute(id);

    if (task.status === TaskStatusEnum.NOT_STARTED) {
      throw new BadRequestException('Task has not been started.');
    }

    if (task.status === TaskStatusEnum.DONE) {
      return { id: task.id, status: task.status };
    }

    task.status = TaskStatusEnum.DONE;
    const saved = await this.tasksRepository.save(task);
    return { id: saved.id, status: saved.status };
  }
}
