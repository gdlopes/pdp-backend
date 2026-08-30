import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersModule } from '../users/users.module';
import { ActionPlansController } from './action-plans.controller';
import {
  CreateActionPlansService,
  FindActionPlanByIdService,
  GetActionPlanByIdService,
  GetActionPlansByUserIdService,
} from './use-cases';

@Module({
  controllers: [ActionPlansController],
  imports: [UsersModule, TypeOrmModule.forFeature([ActionPlansEntity])],
  providers: [
    CreateActionPlansService,
    FindActionPlanByIdService,
    GetActionPlansByUserIdService,
    GetActionPlanByIdService,
  ],
  exports: [FindActionPlanByIdService],
})
export class ActionPlansModule {}
