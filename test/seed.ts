import { DataSource } from 'typeorm';
import UsersEntity from '../src/database/entities/users.entity';

export const seedUsers = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(UsersEntity);

  const mockUser = new UsersEntity();
  mockUser.email = 'existent-user@email.com';
  mockUser.passwordHash =
    '$2b$10$wgnITxUYSLLHRJsdqQ4souxoQKpSkDPllcG6xSStfAqLJHgf/1rbO';

  await userRepository.save(mockUser);
};
