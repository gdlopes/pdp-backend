import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { ActionPlanStatusResponseDto, CreateActionPlanDto } from './dto';
import {
  CreateActionPlanResponse,
  GetActionPlanByIdResponse,
  GetActionPlansByUserIdResponse,
} from './swagger';
import {
  ArchiveActionPlanService,
  CompleteActionPlanService,
  CreateActionPlansService,
  GetActionPlanByIdService,
  GetActionPlansByUserIdService,
  StartActionPlanService,
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
    private readonly startActionPlanService: StartActionPlanService,
    private readonly completeActionPlanService: CompleteActionPlanService,
    private readonly archiveActionPlanService: ArchiveActionPlanService,
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

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Starts an action plan.' })
  @ApiOkResponse({
    description: 'The action plan has been successfully started.',
    type: ActionPlanStatusResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Action plan is completed or archived.',
  })
  @ApiNotFoundResponse({ description: 'Action plan not found.' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.startActionPlanService.execute(user.id, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completes an action plan.' })
  @ApiOkResponse({
    description: 'The action plan has been successfully completed.',
    type: ActionPlanStatusResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Action plan has not been started or is archived.',
  })
  @ApiNotFoundResponse({ description: 'Action plan not found.' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.completeActionPlanService.execute(user.id, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archives an action plan.' })
  @ApiOkResponse({
    description: 'The action plan has been successfully archived.',
    type: ActionPlanStatusResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Action plan not found.' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.archiveActionPlanService.execute(user.id, id);
  }
}
