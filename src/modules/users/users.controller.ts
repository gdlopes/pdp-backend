import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserService } from './use-cases/create-user.service';
import { GetUserByEmailService } from './use-cases/get-user-by-email.service';
import { GetUserByIdService } from './use-cases/get-user-by-id.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly getUserByEmailService: GetUserByEmailService,
    private readonly getUserByIdService: GetUserByIdService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Creates a new user.' })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: CreateUserResponseDto,
  })
  @ApiConflictResponse({ description: 'User already exists.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.createUserService.execute(createUserDto);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Gets a user by e-mail.' })
  @ApiOkResponse({
    description: 'The user has been successfully retrieved.',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'User does not exists.' })
  async findByEmail(@Param('email') email: string) {
    const user = await this.getUserByEmailService.execute(email);
    return { id: user.id, email: user.email };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a user by ID.' })
  @ApiOkResponse({
    description: 'The user has been successfully retrieved.',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'User does not exists.' })
  async findById(@Param('id') id: string) {
    const user = await this.getUserByIdService.execute(id);
    return { id: user.id, email: user.email };
  }
}
