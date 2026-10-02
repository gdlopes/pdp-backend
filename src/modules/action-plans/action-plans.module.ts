import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ActionPlansEntity from '../../database/entities/action-plans.entity';
import { UsersModule } from '../users/users.module';
import { ActionPlansController } from './action-plans.controller';
import {
  ArchiveActionPlanService,
  AssertActionPlanWritableService,
  CompleteActionPlanService,
  CreateActionPlansService,
  FindActionPlanByIdService,
  GetActionPlanByIdService,
  GetActionPlansByUserIdService,
  StartActionPlanService,
} from './use-cases';

@Module({
  controllers: [ActionPlansController],
  imports: [UsersModule, TypeOrmModule.forFeature([ActionPlansEntity])],
  providers: [
    CreateActionPlansService,
    FindActionPlanByIdService,
    GetActionPlansByUserIdService,
    GetActionPlanByIdService,
    AssertActionPlanWritableService,
    StartActionPlanService,
    CompleteActionPlanService,
    ArchiveActionPlanService,
  ],
  exports: [
    FindActionPlanByIdService,
    AssertActionPlanWritableService,
    StartActionPlanService,
    CompleteActionPlanService,
  ],
})
export class ActionPlansModule {}
