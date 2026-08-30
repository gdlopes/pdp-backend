import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity from '../../../database/entities/tasks.entity';
import { GetTaskByIdService } from './get-task-by-id.service';

@Injectable()
export class DeleteTaskService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
    private getTaskByIdService: GetTaskByIdService,
  ) {}

  public async execute(id: string): Promise<void> {
    const task = await this.getTaskByIdService.execute(id);
    await this.tasksRepository.remove(task);
  }
}
