import { Module } from '@nestjs/common';
import { ActionPlansService } from './action-plans.service';
import { ActionPlansController } from './action-plans.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ActionPlansController],
  providers: [ActionPlansService],
})
export class ActionPlansModule {}
