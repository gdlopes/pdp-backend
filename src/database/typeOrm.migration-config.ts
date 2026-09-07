import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import UsersEntity from './entities/users.entity';
import ActionPlansEntity from './entities/action-plans.entity';
import TasksEntity from './entities/tasks.entity';
import RefreshTokensEntity from './entities/refresh-tokens.entity';

config();

const configService = new ConfigService();

const isCompiled = __filename.endsWith('.js');

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USERNAME'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  database: configService.get<string>('DATABASE_NAME'),
  entities: [UsersEntity, ActionPlansEntity, TasksEntity, RefreshTokensEntity],
  migrations: [__dirname + `/migrations/*.${isCompiled ? 'js' : 'ts'}`],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
