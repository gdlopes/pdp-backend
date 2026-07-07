import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';

export const NON_EXISTENT_USER_ID = '00000000-0000-0000-0000-000000000000';
export const EXISTENT_USER_EMAIL = 'existent-user@email.com';

export const buildCreateUserDto = (
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto => ({
  email: 'test@email.com',
  password: '123456',
  ...overrides,
});
