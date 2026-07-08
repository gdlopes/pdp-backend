import { DataSource } from 'typeorm';
import UsersEntity from '../../src/database/entities/users.entity';
import { EXISTENT_USER_EMAIL } from './mock';

export const defaultPasswordHash =
  '$2b$10$wgnITxUYSLLHRJsdqQ4souxoQKpSkDPllcG6xSStfAqLJHgf/1rbO';

export const seedExistentUser = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UsersEntity);

  const existentUser = new UsersEntity();
  existentUser.email = EXISTENT_USER_EMAIL;
  existentUser.passwordHash = defaultPasswordHash;

  return {
    existentUser: await userRepository.save(existentUser),
  };
};

export const seedUsers = seedExistentUser;
