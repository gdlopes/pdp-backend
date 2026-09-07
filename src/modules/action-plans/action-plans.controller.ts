import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
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
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
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
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createActionPlanDto: CreateActionPlanDto,
  ) {
    return this.createActionPlansService.execute(user.id, createActionPlanDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Gets all action plans for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'The action plans have been successfully retrieved.',
    type: GetActionPlansByUserIdResponse,
    isArray: true,
  })
  findByUserId(@CurrentUser() user: AuthenticatedUser) {
    return this.getActionPlansByUserIdService.execute(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets an action plan by ID.' })
  @ApiOkResponse({
    description: 'The action plan has been successfully retrieved.',
    type: GetActionPlanByIdResponse,
  })
  @ApiNotFoundResponse({
    description: 'The action plan was not found.',
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getActionPlanByIdService.execute(user.id, id);
  }
}
