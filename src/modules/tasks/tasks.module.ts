import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import TasksEntity from '../../database/entities/tasks.entity';
import { ActionPlansModule } from '../action-plans/action-plans.module';
import { TasksController } from './tasks.controller';
import {
  CompleteTaskService,
  CreateTaskService,
  DeleteTaskService,
  GetTaskByIdService,
  GetTasksByActionPlanIdService,
  StartTaskService,
} from './use-cases';

@Module({
  controllers: [TasksController],
  imports: [ActionPlansModule, TypeOrmModule.forFeature([TasksEntity])],
  providers: [
    CreateTaskService,
    GetTasksByActionPlanIdService,
    GetTaskByIdService,
    StartTaskService,
    CompleteTaskService,
    DeleteTaskService,
  ],
})
export class TasksModule {}
