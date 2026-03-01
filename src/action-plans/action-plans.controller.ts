import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import {
  CreateActionPlansService,
  GetActionPlansByUserIdService,
} from './use-cases';

@Controller('action-plans')
export class ActionPlansController {
  constructor(
    private readonly createActionPlansService: CreateActionPlansService,
    private readonly getActionPlansByUserIdService: GetActionPlansByUserIdService,
  ) {}

  @Post()
  create(@Body() createActionPlanDto: CreateActionPlanDto) {
    return this.createActionPlansService.execute(createActionPlanDto);
  }

  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.getActionPlansByUserIdService.execute(userId);
  }
}
