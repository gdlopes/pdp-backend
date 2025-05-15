import { Controller, Post, Body } from '@nestjs/common';
import { ActionPlansService } from './action-plans.service';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';

@Controller('action-plans')
export class ActionPlansController {
  constructor(private readonly actionPlansService: ActionPlansService) {}

  @Post()
  create(@Body() createActionPlanDto: CreateActionPlanDto) {
    return this.actionPlansService.create(createActionPlanDto);
  }
}
