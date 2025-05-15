import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import UsersEntity from '../database/entities/users.entity';
import { Repository } from 'typeorm';
import { hashSync } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const databaseUser = new UsersEntity();
    databaseUser.email = createUserDto.email;
    databaseUser.passwordHash = hashSync(createUserDto.password, 10);

    const userAlreadyExists = await this.findUserByEmail(createUserDto.email);

    if (userAlreadyExists) throw new ConflictException('User already exists.');

    const { id, email } =
      await this.usersRepository.save<UsersEntity>(databaseUser);

    return { id, email };
  }

  async findUserByEmail(email: string): Promise<UsersEntity | null> {
    const foundUser = await this.usersRepository.findOne({
      where: { email },
    });

    return foundUser;
  }
}
