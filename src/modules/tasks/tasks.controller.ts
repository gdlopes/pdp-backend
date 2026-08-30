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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.createTaskService.execute(createTaskDto);
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
  findByActionPlanId(@Query('actionPlanId') actionPlanId: string) {
    return this.getTasksByActionPlanIdService.execute(actionPlanId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a task by ID.' })
  @ApiOkResponse({
    description: 'The task has been successfully retrieved.',
    type: GetTaskByIdResponse,
  })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  findOne(@Param('id') id: string) {
    return this.getTaskByIdService.execute(id);
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
  start(@Param('id') id: string) {
    return this.startTaskService.execute(id);
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
  complete(@Param('id') id: string) {
    return this.completeTaskService.execute(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletes a task.' })
  @ApiNoContentResponse({
    description: 'The task has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Task not found.' })
  delete(@Param('id') id: string) {
    return this.deleteTaskService.execute(id);
  }
}
