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

  public async execute(userId: string, id: string): Promise<TasksEntity> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['actionPlan'],
    });

    if (!task || !task.actionPlan || task.actionPlan.userId !== userId) {
      throw new NotFoundException('Task not found.');
    }

    delete (task as { actionPlan?: unknown }).actionPlan;

    return task;
  }
}
