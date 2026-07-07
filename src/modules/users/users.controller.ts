import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserService } from './use-cases/create-user.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly createUserService: CreateUserService) {}

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
}
