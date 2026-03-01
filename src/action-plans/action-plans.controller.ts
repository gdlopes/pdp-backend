import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import {
  CreateActionPlansService,
  GetActionPlanByIdService,
  GetActionPlansByUserIdService,
} from './use-cases';

@Controller('action-plans')
export class ActionPlansController {
  constructor(
    private readonly createActionPlansService: CreateActionPlansService,
    private readonly getActionPlansByUserIdService: GetActionPlansByUserIdService,
    private readonly getActionPlanByIdService: GetActionPlanByIdService,
  ) {}

  @Post()
  create(@Body() createActionPlanDto: CreateActionPlanDto) {
    return this.createActionPlansService.execute(createActionPlanDto);
  }

  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.getActionPlansByUserIdService.execute(userId);
  }

  @Get('user/:userId/:id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.getActionPlanByIdService.execute(userId, id);
  }
}
