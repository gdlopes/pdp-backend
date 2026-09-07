import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import UsersEntity from '../../../database/entities/users.entity';

@Injectable()
export class GetUserByEmailService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
  ) {}

  async execute(email: string): Promise<UsersEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }
}
