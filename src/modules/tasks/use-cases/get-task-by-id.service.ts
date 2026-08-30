import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import TasksEntity from '../../../database/entities/tasks.entity';

@Injectable()
export class GetTaskByIdService {
  constructor(
    @InjectRepository(TasksEntity)
    private tasksRepository: Repository<TasksEntity>,
  ) {}

  public async execute(id: string): Promise<TasksEntity> {
    const task = await this.tasksRepository.findOneBy({ id });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    return task;
  }
}
