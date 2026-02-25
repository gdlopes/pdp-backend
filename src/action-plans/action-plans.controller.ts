import { Controller, Post, Body } from '@nestjs/common';
import { CreateActionPlansService } from './use-cases/create-action-plans.service';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';

@Controller('action-plans')
export class ActionPlansController {
  constructor(
    private readonly createActionPlansService: CreateActionPlansService,
  ) {}

  @Post()
  create(@Body() createActionPlanDto: CreateActionPlanDto) {
    return this.createActionPlansService.execute(createActionPlanDto);
  }
}
