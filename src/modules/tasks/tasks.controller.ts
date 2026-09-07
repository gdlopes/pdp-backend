import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  CreateTaskDto,
  CreateTaskResponseDto,
  TaskStatusResponseDto,
} from './dto';
import { GetTaskByIdResponse, GetTasksByActionPlanIdResponse } from './swagger';
import {
  CompleteTaskService,
  CreateTaskService,
  DeleteTaskService,
  GetTaskByIdService,
  GetTasksByActionPlanIdService,
  StartTaskService,
} from './use-cases';

@Controller('tasks')
@ApiTags('tasks')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
export class TasksController {
  constructor(
    private readonly createTaskService: CreateTaskService,
    private readonly getTasksByActionPlanIdService: GetTasksByActionPlanIdService,
    private readonly getTaskByIdService: GetTaskByIdService,
    private readonly startTaskService: StartTaskService,
    private readonly completeTaskService: CompleteTaskService,
    private readonly deleteTaskService: DeleteTaskService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new task.' })
  @ApiCreatedResponse({
    description: 'The task has been successfully created.',
    type: CreateTaskResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Action plan does not exists.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.createTaskService.execute(user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Gets all tasks by action plan ID.' })
  @ApiQuery({ name: 'actionPlanId', required: true, type: String })
  @ApiOkResponse({
    description: 'The tasks have been successfully retrieved.',
    type: GetTasksByActionPlanIdResponse,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Action plan does not exists.' })
  findByActionPlanId(
    @CurrentUser() user: AuthenticatedUser,
    @Query('actionPlanId') actionPlanId: string,
  ) {
    return this.getTasksByActionPlanIdService.execute(user.id, actionPlanId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a task by ID.' })
  @ApiOkResponse({
    description: 'The task has been successfully retrieved.',
    type: GetTaskByIdResponse,
  })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getTaskByIdService.execute(user.id, id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Starts a task.' })
  @ApiOkResponse({
    description: 'The task has been successfully started.',
    type: TaskStatusResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Task is already done.' })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.startTaskService.execute(user.id, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completes a task.' })
  @ApiOkResponse({
    description: 'The task has been successfully completed.',
    type: TaskStatusResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Task has not been started.' })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.completeTaskService.execute(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletes a task.' })
  @ApiNoContentResponse({
    description: 'The task has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.deleteTaskService.execute(user.id, id);
  }
}
