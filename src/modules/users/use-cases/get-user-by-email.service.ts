import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import UsersEntity from '../../../database/entities/users.entity';

@Injectable()
export class GetUserByEmailService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
  ) {}

  async execute(email: string): Promise<UsersEntity> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) throw new BadRequestException('User does not exists.');

    return user;
  }
}
