import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateActionPlanDto } from './dto/create-action-plan.dto';
import {
  CreateActionPlanResponse,
  GetActionPlanByIdResponse,
  GetActionPlansByUserIdResponse,
} from './swagger';
import {
  CreateActionPlansService,
  GetActionPlanByIdService,
  GetActionPlansByUserIdService,
} from './use-cases';

@Controller('action-plans')
@ApiTags('action-plans')
export class ActionPlansController {
  constructor(
    private readonly createActionPlansService: CreateActionPlansService,
    private readonly getActionPlansByUserIdService: GetActionPlansByUserIdService,
    private readonly getActionPlanByIdService: GetActionPlanByIdService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new action plan.' })
  @ApiCreatedResponse({
    description: 'The action plan has been successfully created.',
    type: CreateActionPlanResponse,
  })
  create(@Body() createActionPlanDto: CreateActionPlanDto) {
    return this.createActionPlansService.execute(createActionPlanDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Gets all action plans by user ID.' })
  @ApiOkResponse({
    description: 'The action plans have been successfully retrieved.',
    type: GetActionPlansByUserIdResponse,
    isArray: true,
  })
  findByUserId(@Param('userId') userId: string) {
    return this.getActionPlansByUserIdService.execute(userId);
  }

  @Get('user/:userId/:id')
  @ApiOperation({ summary: 'Gets an action plan by ID.' })
  @ApiOkResponse({
    description: 'The action plan has been successfully retrieved.',
    type: GetActionPlanByIdResponse,
  })
  @ApiNotFoundResponse({
    description: 'The action plan was not found.',
  })
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.getActionPlanByIdService.execute(userId, id);
  }
}
