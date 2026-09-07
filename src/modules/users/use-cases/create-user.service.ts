import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import UsersEntity from '../../../database/entities/users.entity';
import { CreateUserDto } from '../dto/create-user.dto';

const PASSWORD_HASH_COST = 12;

@Injectable()
export class CreateUserService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
  ) {}

  async execute(createUserDto: CreateUserDto) {
    const databaseUser = new UsersEntity();
    databaseUser.email = createUserDto.email;
    databaseUser.passwordHash = await hash(
      createUserDto.password,
      PASSWORD_HASH_COST,
    );

    const userAlreadyExists = await this.validateUserExists(
      createUserDto.email,
    );

    if (userAlreadyExists) throw new ConflictException('User already exists.');

    const { id, email } =
      await this.usersRepository.save<UsersEntity>(databaseUser);

    return { id, email };
  }

  private async validateUserExists(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });

    return !!user;
  }
}
