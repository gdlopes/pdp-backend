import { Module } from '@nestjs/common';
import { CreateActionPlansService } from './use-cases/create-action-plans.service';
import { ActionPlansController } from './action-plans.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import ActionPlansEntity from '../database/entities/action-plans.entity';

@Module({
  controllers: [ActionPlansController],
  imports: [UsersModule, TypeOrmModule.forFeature([ActionPlansEntity])],
  providers: [CreateActionPlansService],
})
export class ActionPlansModule {}
