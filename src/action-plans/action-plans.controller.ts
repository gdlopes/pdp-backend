import { Body, Controller, Post } from '@nestjs/common';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import { CreateActionPlansService } from './use-cases/create-action-plans.service';

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
