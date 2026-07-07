import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UsersEntity from '../../database/entities/users.entity';
import {
  CreateUserService,
  GetUserByEmailService,
  GetUserByIdService,
} from './use-cases';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  imports: [TypeOrmModule.forFeature([UsersEntity])],
  providers: [CreateUserService, GetUserByEmailService, GetUserByIdService],
  exports: [CreateUserService, GetUserByIdService],
})
export class UsersModule {}
